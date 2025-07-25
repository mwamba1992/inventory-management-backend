import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/account.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Common } from '../../settings/common/entities/common.entity';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Common)
    private readonly commonRepository: Repository<Common>,
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const account = new Account();
    account.name = createAccountDto.name;

    const code = await this.commonRepository.findOne({
      where: { id: createAccountDto.codeId },
    });
    if (!code) {
      throw new NotFoundException(
        `Account code with ID ${createAccountDto.codeId} not found`,
      );
    }
    account.code = code;

    const type = await this.commonRepository.findOne({
      where: { id: createAccountDto.typeId },
    });
    if (!type) {
      throw new NotFoundException(
        `Account type with ID ${createAccountDto.typeId} not found`,
      );
    }
    account.type = type;

    if (createAccountDto.parentAccountId) {
      const parent = await this.accountRepository.findOne({
        where: { id: createAccountDto.parentAccountId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent account with ID ${createAccountDto.parentAccountId} not found`,
        );
      }
      account.parentAccount = parent;
    } else {
      account.parentAccount = null;
    }

    return this.accountRepository.save(account);
  }

  findAll() {
    return this.accountRepository.find({
      relations: ['code', 'type', 'parentAccount', 'childAccounts'],
    });
  }

  findOne(id: number) {
    return this.accountRepository.findOne({
      where: { id },
      relations: ['code', 'type', 'parentAccount', 'childAccounts'],
    });
  }

  async update(id: number, updateDto: UpdateAccountDto) {
    return this.accountRepository.update(id, updateDto);
  }

  async remove(id: number) {
    const account = await this.accountRepository.findOneBy({ id });
    if (!account) return null;
    return this.accountRepository.remove(account);
  }

}
