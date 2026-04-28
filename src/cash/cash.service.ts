import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  CashMethod,
  CashMovement,
  CashMovementSource,
  CashMovementType,
} from './entities/cash-movement.entity';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { CashQueryDto } from './dto/cash-query.dto';
import { UserContextService } from '../auth/user/dto/user.context';

@Injectable()
export class CashService {
  constructor(
    @InjectRepository(CashMovement)
    private readonly cashRepo: Repository<CashMovement>,
    private readonly userContextService: UserContextService,
  ) {}

  async create(dto: CreateCashMovementDto): Promise<CashMovement> {
    const businessId = this.userContextService.getBusinessId();
    const movement = this.cashRepo.create({
      type: dto.type,
      source: dto.source,
      sourceId: dto.sourceId ?? null,
      amount: dto.amount,
      method: dto.method ?? CashMethod.CASH,
      notes: dto.notes,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      businessId,
    });
    return this.cashRepo.save(movement);
  }

  async findAll(query: CashQueryDto = {}): Promise<CashMovement[]> {
    const businessId = this.userContextService.getBusinessId();
    const where: any = { businessId };
    if (query.method) where.method = query.method;
    if (query.type) where.type = query.type;
    if (query.source) where.source = query.source;
    if (query.startDate && query.endDate) {
      where.occurredAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }
    return this.cashRepo.find({
      where,
      order: { occurredAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CashMovement> {
    const businessId = this.userContextService.getBusinessId();
    const movement = await this.cashRepo.findOne({
      where: { id, businessId },
    });
    if (!movement) {
      throw new NotFoundException(`Cash movement ${id} not found`);
    }
    return movement;
  }

  async update(
    id: number,
    dto: Partial<CreateCashMovementDto>,
  ): Promise<CashMovement> {
    const movement = await this.findOne(id);
    if (dto.type !== undefined) movement.type = dto.type;
    if (dto.source !== undefined) movement.source = dto.source;
    if (dto.sourceId !== undefined) movement.sourceId = dto.sourceId;
    if (dto.amount !== undefined) movement.amount = dto.amount;
    if (dto.method !== undefined) movement.method = dto.method;
    if (dto.notes !== undefined) movement.notes = dto.notes;
    if (dto.occurredAt !== undefined) {
      movement.occurredAt = new Date(dto.occurredAt);
    }
    return this.cashRepo.save(movement);
  }

  async remove(id: number): Promise<void> {
    const movement = await this.findOne(id);
    await this.cashRepo.softRemove(movement);
  }

  async getBalance(): Promise<{
    total: number;
    byMethod: Record<string, number>;
  }> {
    const businessId = this.userContextService.getBusinessId();
    const rows = await this.cashRepo
      .createQueryBuilder('m')
      .select('m.method', 'method')
      .addSelect(
        "SUM(CASE WHEN m.type = 'in' THEN m.amount ELSE -m.amount END)",
        'balance',
      )
      .where('m.business_id = :businessId', { businessId })
      .andWhere('m.deleted = false')
      .groupBy('m.method')
      .getRawMany();

    const byMethod: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      const balance = Number(r.balance ?? 0);
      byMethod[r.method] = balance;
      total += balance;
    }
    return { total, byMethod };
  }

  /**
   * Internal helper for auto-hooks (sale-delivered, expense-created, purchase).
   * Bypasses the createDto validation so callers can wire it from services.
   */
  async recordMovement(params: {
    type: CashMovementType;
    source: CashMovementSource;
    sourceId: number | null;
    amount: number;
    method?: CashMethod;
    notes?: string;
    occurredAt?: Date;
    businessId: number;
  }): Promise<CashMovement> {
    const movement = this.cashRepo.create({
      type: params.type,
      source: params.source,
      sourceId: params.sourceId,
      amount: params.amount,
      method: params.method ?? CashMethod.CASH,
      notes: params.notes,
      occurredAt: params.occurredAt ?? new Date(),
      businessId: params.businessId,
    });
    return this.cashRepo.save(movement);
  }
}
