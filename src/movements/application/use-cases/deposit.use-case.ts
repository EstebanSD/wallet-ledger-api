import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../../../accounts/application/ports/account-repository.port';
import { Movement, MovementType } from '../../domain/entities/movement.entity';
import {
  MOVEMENT_REPOSITORY,
  type MovementRepositoryPort,
} from '../ports/movement-repository.port';
import {
  BALANCE_CACHE,
  type BalanceCachePort,
} from '../ports/balance-cache.port';
import { AccountNotFoundError } from '../errors';

export interface DepositInput {
  accountId: string;
  amount: number;
}

export interface DepositOutput {
  id: string;
  accountId: string;
  type: MovementType;
  amount: number;
  createdAt: Date;
}

@Injectable()
export class DepositUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(MOVEMENT_REPOSITORY)
    private readonly movementRepository: MovementRepositoryPort,
    @Inject(BALANCE_CACHE)
    private readonly cache: BalanceCachePort,
  ) {}

  async execute(input: DepositInput): Promise<DepositOutput> {
    // Invariante #3: todo movimiento referencia una cuenta existente.
    const account = await this.accountRepository.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const movement = Movement.create({
      id: randomUUID(),
      accountId: input.accountId,
      type: MovementType.CREDIT,
      amount: input.amount,
    });

    await this.movementRepository.save(movement);
    await this.cache.invalidate(input.accountId); // post-commit, ADR-0003
    return {
      id: movement.id,
      accountId: movement.accountId,
      type: movement.type,
      amount: movement.amount,
      createdAt: movement.createdAt,
    };
  }
}
