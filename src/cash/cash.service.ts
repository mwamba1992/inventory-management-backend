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
   * Cash flow statement: in vs out grouped by source for a date range.
   * Returns gross totals and net change so the frontend can render a P&L-style view.
   */
  async getStatement(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    period: { startDate: string | null; endDate: string | null };
    inflows: { source: string; amount: number }[];
    outflows: { source: string; amount: number }[];
    totalIn: number;
    totalOut: number;
    net: number;
  }> {
    const businessId = this.userContextService.getBusinessId();
    const qb = this.cashRepo
      .createQueryBuilder('m')
      .select('m.source', 'source')
      .addSelect('m.type', 'type')
      .addSelect('SUM(m.amount)', 'amount')
      .where('m.business_id = :businessId', { businessId })
      .andWhere('m.deleted = false');

    if (startDate && endDate) {
      qb.andWhere('m.occurred_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const rows = await qb
      .groupBy('m.source')
      .addGroupBy('m.type')
      .getRawMany();

    const inflows: { source: string; amount: number }[] = [];
    const outflows: { source: string; amount: number }[] = [];
    let totalIn = 0;
    let totalOut = 0;
    for (const r of rows) {
      const amount = Number(r.amount ?? 0);
      if (r.type === 'in') {
        inflows.push({ source: r.source, amount });
        totalIn += amount;
      } else {
        outflows.push({ source: r.source, amount });
        totalOut += amount;
      }
    }

    return {
      period: { startDate: startDate ?? null, endDate: endDate ?? null },
      inflows: inflows.sort((a, b) => b.amount - a.amount),
      outflows: outflows.sort((a, b) => b.amount - a.amount),
      totalIn,
      totalOut,
      net: totalIn - totalOut,
    };
  }

  /**
   * Daily cash balance over time — useful for charts.
   */
  async getTimeline(
    startDate: string,
    endDate: string,
  ): Promise<
    { date: string; in: number; out: number; net: number; runningBalance: number }[]
  > {
    const businessId = this.userContextService.getBusinessId();

    // Opening balance: everything before startDate
    const openingRow = await this.cashRepo
      .createQueryBuilder('m')
      .select(
        "COALESCE(SUM(CASE WHEN m.type = 'in' THEN m.amount ELSE -m.amount END), 0)",
        'opening',
      )
      .where('m.business_id = :businessId', { businessId })
      .andWhere('m.deleted = false')
      .andWhere('m.occurred_at < :startDate', { startDate })
      .getRawOne();

    let running = Number(openingRow?.opening ?? 0);

    const dailyRows = await this.cashRepo
      .createQueryBuilder('m')
      .select("TO_CHAR(m.occurred_at, 'YYYY-MM-DD')", 'date')
      .addSelect("SUM(CASE WHEN m.type = 'in' THEN m.amount ELSE 0 END)", 'in')
      .addSelect("SUM(CASE WHEN m.type = 'out' THEN m.amount ELSE 0 END)", 'out')
      .where('m.business_id = :businessId', { businessId })
      .andWhere('m.deleted = false')
      .andWhere('m.occurred_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return dailyRows.map((r) => {
      const inAmt = Number(r.in ?? 0);
      const outAmt = Number(r.out ?? 0);
      const net = inAmt - outAmt;
      running += net;
      return {
        date: r.date,
        in: inAmt,
        out: outAmt,
        net,
        runningBalance: running,
      };
    });
  }

  /**
   * Cash runway estimate: given current balance and last-30-day average daily outflow,
   * return weeks until the balance hits zero. Useful as a "are we ok?" gauge.
   */
  async getRunway(): Promise<{
    currentBalance: number;
    avgDailyOutflow: number;
    avgDailyInflow: number;
    netDailyChange: number;
    daysRemaining: number | null;
    weeksRemaining: number | null;
  }> {
    const { total } = await this.getBalance();

    const businessId = this.userContextService.getBusinessId();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString().split('T')[0];

    const row = await this.cashRepo
      .createQueryBuilder('m')
      .select("SUM(CASE WHEN m.type = 'in' THEN m.amount ELSE 0 END)", 'inflow')
      .addSelect("SUM(CASE WHEN m.type = 'out' THEN m.amount ELSE 0 END)", 'outflow')
      .where('m.business_id = :businessId', { businessId })
      .andWhere('m.deleted = false')
      .andWhere('m.occurred_at >= :since', { since: sinceStr })
      .getRawOne();

    const inflow30 = Number(row?.inflow ?? 0);
    const outflow30 = Number(row?.outflow ?? 0);
    const avgDailyOutflow = outflow30 / 30;
    const avgDailyInflow = inflow30 / 30;
    const netDailyChange = avgDailyInflow - avgDailyOutflow;

    let daysRemaining: number | null = null;
    if (netDailyChange < 0 && avgDailyOutflow > 0) {
      // Burning more than earning — runway = balance / |net daily burn|
      daysRemaining = Math.floor(total / Math.abs(netDailyChange));
    }

    return {
      currentBalance: total,
      avgDailyOutflow: Number(avgDailyOutflow.toFixed(2)),
      avgDailyInflow: Number(avgDailyInflow.toFixed(2)),
      netDailyChange: Number(netDailyChange.toFixed(2)),
      daysRemaining,
      weeksRemaining: daysRemaining !== null ? Math.floor(daysRemaining / 7) : null,
    };
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
