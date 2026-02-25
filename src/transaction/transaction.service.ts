import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InventoryTransaction } from './entities/transaction.entity';
import { UserContextService } from '../auth/user/dto/user.context';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepo: Repository<InventoryTransaction>,
    private readonly userContextService: UserContextService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const transaction = this.transactionRepo.create({
      ...createTransactionDto,
      businessId: this.userContextService.getBusinessId(),
    });
    return this.transactionRepo.save(transaction);
  }

  findAll() {
    return this.transactionRepo.find({
      where: { businessId: this.userContextService.getBusinessId() },
    });
  }

  async findOne(id: number) {
    const transaction = await this.transactionRepo.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
    });
    if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
    return transaction;
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.transactionRepo.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
    });
    if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
    Object.assign(transaction, updateTransactionDto);
    return this.transactionRepo.save(transaction);
  }

  async remove(id: number) {
    const transaction = await this.transactionRepo.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
    });
    if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
    await this.transactionRepo.remove(transaction);
  }
}
