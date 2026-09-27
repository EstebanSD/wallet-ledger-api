import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Account } from '../../domain/entities/account.entity';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../ports/account-repository.port';

export interface CreateAccountInput {
  ownerRef: string;
  currency: string;
}

export interface CreateAccountOutput {
  id: string;
  ownerRef: string;
  currency: string;
  createdAt: Date;
}

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    // El id se genera acá, no en la DB
    // así la entidad de dominio existe completa ANTES de tocar persistencia,
    const account = Account.create({
      id: randomUUID(),
      ownerRef: input.ownerRef,
      currency: input.currency.toUpperCase(),
    });

    await this.accountRepository.save(account);

    return {
      id: account.id,
      ownerRef: account.ownerRef,
      currency: account.currency,
      createdAt: account.createdAt,
    };
  }
}
