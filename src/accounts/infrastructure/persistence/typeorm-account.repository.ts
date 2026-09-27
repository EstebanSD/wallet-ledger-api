import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../../application/ports/account-repository.port';
import { AccountOrmEntity } from './account.orm-entity';

@Injectable()
export class TypeOrmAccountRepository implements AccountRepositoryPort {
  constructor(
    @InjectRepository(AccountOrmEntity)
    private readonly repository: Repository<AccountOrmEntity>,
  ) {}

  async save(account: Account): Promise<void> {
    const row = this.repository.create({
      id: account.id,
      ownerRef: account.ownerRef,
      currency: account.currency,
      createdAt: account.createdAt,
    });
    await this.repository.save(row);
  }

  async findById(id: string): Promise<Account | null> {
    const row = await this.repository.findOne({ where: { id } });
    if (!row) return null;

    return Account.reconstitute({
      id: row.id,
      ownerRef: row.ownerRef,
      currency: row.currency,
      createdAt: row.createdAt,
    });
  }
}
