import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Item } from '../items/item/entities/item.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
import { InventoryTransaction } from '../transaction/entities/transaction.entity';
import {
  CashMethod,
  CashMovement,
  CashMovementSource,
  CashMovementType,
} from './entities/cash-movement.entity';
import { RecordPurchaseDto } from './dto/record-purchase.dto';
import { UserContextService } from '../auth/user/dto/user.context';

export interface RecordPurchaseResult {
  transaction: InventoryTransaction;
  movement: CashMovement;
  stock: { quantity: number; inTransit: number };
}

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(ItemStock)
    private readonly itemStockRepo: Repository<ItemStock>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepo: Repository<InventoryTransaction>,
    @InjectRepository(CashMovement)
    private readonly cashRepo: Repository<CashMovement>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly userContextService: UserContextService,
  ) {}

  /**
   * Record an inventory purchase atomically:
   *   1) Create an inventory_transaction (type=purchase) at order time
   *   2) Bump item_stock: quantity += qty AND inTransit += qty
   *      (quantity is total stock; physical = quantity - inTransit)
   *   3) Create cash_movement (type=out, source=purchase) for the cash leaving today
   *
   * All three writes commit together or none of them do.
   */
  async recordPurchase(dto: RecordPurchaseDto): Promise<RecordPurchaseResult> {
    const businessId = this.userContextService.getBusinessId();

    const item = await this.itemRepo.findOne({
      where: { id: dto.itemId, businessId },
    });
    if (!item) {
      throw new NotFoundException(`Item ${dto.itemId} not found for this business`);
    }

    const orderDate = dto.orderDate ? new Date(dto.orderDate) : new Date();
    const unitCost = Number((dto.totalCost / dto.quantity).toFixed(2));

    return this.dataSource.transaction(async (manager) => {
      const stockRepo = manager.getRepository(ItemStock);
      const txRepo = manager.getRepository(InventoryTransaction);
      const cashRepo = manager.getRepository(CashMovement);

      let stock = await stockRepo.findOne({
        where: {
          item: { id: dto.itemId },
          warehouse: { id: dto.warehouseId },
        },
        relations: ['item', 'warehouse'],
      });

      if (!stock) {
        // First-ever stock row for this item+warehouse — create it
        stock = stockRepo.create({
          item: { id: dto.itemId } as Item,
          warehouse: { id: dto.warehouseId } as any,
          quantity: 0,
          inTransit: 0,
        });
      }

      stock.quantity = Number(stock.quantity) + dto.quantity;
      stock.inTransit = Number(stock.inTransit) + dto.quantity;
      const savedStock = await stockRepo.save(stock);

      const transaction = txRepo.create({
        item: { id: dto.itemId } as Item,
        businessId,
        transactionType: 'purchase',
        quantity: dto.quantity,
        unitPrice: 0,
        unitCost,
        totalPrice: dto.totalCost,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes ?? dto.supplierName,
        inventoryImpact: dto.totalCost,
        revenueImpact: 0,
        cogsImpact: 0,
        transactionDate: orderDate,
      });
      const savedTx = await txRepo.save(transaction);

      const movement = cashRepo.create({
        type: CashMovementType.OUT,
        source: CashMovementSource.PURCHASE,
        sourceId: savedTx.id,
        amount: dto.totalCost,
        method: dto.method ?? CashMethod.CASH,
        notes: this.composeMovementNote(dto, item.name),
        occurredAt: orderDate,
        businessId,
      });
      const savedMovement = await cashRepo.save(movement);

      return {
        transaction: savedTx,
        movement: savedMovement,
        stock: {
          quantity: savedStock.quantity,
          inTransit: savedStock.inTransit,
        },
      };
    });
  }

  private composeMovementNote(dto: RecordPurchaseDto, itemName: string): string {
    const parts = [
      `Purchase: ${dto.quantity}× ${itemName}`,
      dto.supplierName ? `from ${dto.supplierName}` : null,
      dto.referenceNumber ? `(ref ${dto.referenceNumber})` : null,
      dto.notes,
    ].filter(Boolean);
    return parts.join(' ');
  }
}
