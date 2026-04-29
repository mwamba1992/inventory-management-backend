import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Sale } from '../sale/entities/sale.entity';
import { Expense } from '../expense/entities/expense.entity';
import {
  CashMethod,
  CashMovement,
  CashMovementSource,
  CashMovementType,
} from './entities/cash-movement.entity';
import { UserContextService } from '../auth/user/dto/user.context';

/**
 * Reconciles the cash ledger with sales and expenses that exist but
 * don't yet have a corresponding cash_movement row. Safe to run any time —
 * it only inserts missing rows, never duplicates.
 */
@Injectable()
export class CashSyncService {
  private readonly logger = new Logger(CashSyncService.name);

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(CashMovement)
    private readonly cashRepo: Repository<CashMovement>,
    private readonly userContextService: UserContextService,
  ) {}

  async syncAll(since?: string): Promise<{
    since: string;
    salesAdded: number;
    expensesAdded: number;
    totalIn: number;
    totalOut: number;
  }> {
    const businessId = this.userContextService.getBusinessId();
    // Default cutoff: start of today (00:00 local server time).
    // Anything earlier than this is considered historical and is NOT backfilled,
    // so the ledger starts clean from launch day.
    const cutoff = since ? new Date(since) : this.startOfToday();
    const salesResult = await this.syncSales(businessId, cutoff);
    const expensesResult = await this.syncExpenses(businessId, cutoff);
    return {
      since: cutoff.toISOString(),
      salesAdded: salesResult.added,
      expensesAdded: expensesResult.added,
      totalIn: salesResult.totalAmount,
      totalOut: expensesResult.totalAmount,
    };
  }

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private async syncSales(
    businessId: number,
    cutoff: Date,
  ): Promise<{ added: number; totalAmount: number }> {
    // Only sales delivered on or after the cutoff.
    const deliveredSales = await this.saleRepo.find({
      where: {
        businessId,
        status: 'delivered' as any,
        deliveredAt: MoreThanOrEqual(cutoff),
      },
      relations: ['item'],
    });

    if (deliveredSales.length === 0) {
      return { added: 0, totalAmount: 0 };
    }

    // Find which sale IDs already have a matching cash_movement
    const existing = await this.cashRepo
      .createQueryBuilder('m')
      .select('DISTINCT m.source_id', 'sourceId')
      .where('m.business_id = :businessId', { businessId })
      .andWhere('m.source = :source', { source: CashMovementSource.SALE })
      .andWhere('m.deleted = false')
      .getRawMany();
    const existingIds = new Set<number>(
      existing.map((r) => Number(r.sourceId)).filter((n) => !isNaN(n)),
    );

    const toInsert = deliveredSales.filter((s) => !existingIds.has(s.id));
    if (toInsert.length === 0) {
      return { added: 0, totalAmount: 0 };
    }

    let totalAmount = 0;
    const movements = toInsert.map((sale) => {
      const amount = Number(sale.amountPaid);
      totalAmount += amount;
      return this.cashRepo.create({
        type: CashMovementType.IN,
        source: CashMovementSource.SALE,
        sourceId: sale.id,
        amount,
        method: CashMethod.CASH,
        notes: `Sale #SALE-${sale.id} — ${sale.item?.name ?? 'item'} (synced)`,
        occurredAt: sale.deliveredAt ?? sale.createdAt ?? new Date(),
        businessId,
      });
    });

    await this.cashRepo.save(movements);
    this.logger.log(`Sync: created ${movements.length} cash-in rows from sales`);
    return { added: movements.length, totalAmount };
  }

  private async syncExpenses(
    businessId: number,
    cutoff: Date,
  ): Promise<{ added: number; totalAmount: number }> {
    const allExpenses = await this.expenseRepo.find({
      where: { businessId, expenseDate: MoreThanOrEqual(cutoff) },
    });
    if (allExpenses.length === 0) {
      return { added: 0, totalAmount: 0 };
    }

    const existing = await this.cashRepo
      .createQueryBuilder('m')
      .select('DISTINCT m.source_id', 'sourceId')
      .where('m.business_id = :businessId', { businessId })
      .andWhere('m.source = :source', { source: CashMovementSource.EXPENSE })
      .andWhere('m.deleted = false')
      .getRawMany();
    const existingIds = new Set<number>(
      existing.map((r) => Number(r.sourceId)).filter((n) => !isNaN(n)),
    );

    const toInsert = allExpenses.filter((e) => !existingIds.has(e.id));
    if (toInsert.length === 0) {
      return { added: 0, totalAmount: 0 };
    }

    let totalAmount = 0;
    const movements = toInsert.map((expense) => {
      const amount = Number(expense.amount);
      totalAmount += amount;
      return this.cashRepo.create({
        type: CashMovementType.OUT,
        source: CashMovementSource.EXPENSE,
        sourceId: expense.id,
        amount,
        method: CashMethod.CASH,
        notes: `${expense.title}${expense.category ? ` (${expense.category})` : ''} (synced)`,
        occurredAt: expense.expenseDate ?? new Date(),
        businessId,
      });
    });

    await this.cashRepo.save(movements);
    this.logger.log(
      `Sync: created ${movements.length} cash-out rows from expenses`,
    );
    return { added: movements.length, totalAmount };
  }
}
