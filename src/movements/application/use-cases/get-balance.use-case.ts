import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../../../accounts/application/ports/account-repository.port';
import { AccountNotFoundError } from '../errors';
import {
  BALANCE_CACHE,
  type BalanceCachePort,
} from '../ports/balance-cache.port';
import {
  MOVEMENT_REPOSITORY,
  type MovementRepositoryPort,
} from '../ports/movement-repository.port';

export interface GetBalanceInput {
  accountId: string;
}

export interface GetBalanceOutput {
  accountId: string;
  currency: string;
  balance: number;
  // Solo para verificar el comportamiento de la caché en dev/demo.
  // No es un campo de negocio.
  source: 'cache' | 'database';
}

@Injectable()
export class GetBalanceUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(MOVEMENT_REPOSITORY)
    private readonly movementRepository: MovementRepositoryPort,
    @Inject(BALANCE_CACHE)
    private readonly cache: BalanceCachePort,
  ) {}

  async execute(input: GetBalanceInput): Promise<GetBalanceOutput> {
    const account = await this.accountRepository.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const cached = await this.cache.get(account.id);
    if (cached !== null) {
      return {
        accountId: account.id,
        currency: account.currency,
        balance: cached,
        source: 'cache',
      };
    }

    const balance = await this.movementRepository.getBalance(account.id);
    await this.cache.set(account.id, balance);

    return {
      accountId: account.id,
      currency: account.currency,
      balance,
      source: 'database',
    };
  }
}
