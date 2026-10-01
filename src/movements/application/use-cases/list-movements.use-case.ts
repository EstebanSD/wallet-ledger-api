import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../../../accounts/application/ports/account-repository.port';
import { MovementType } from '../../domain/entities/movement.entity';
import { AccountNotFoundError } from '../errors';
import {
  MOVEMENT_REPOSITORY,
  type MovementRepositoryPort,
} from '../ports/movement-repository.port';

export interface ListMovementsInput {
  accountId: string;
  type?: MovementType;
  from?: string; // ISO 8601, ya validado por el DTO
  to?: string;
  page: number;
  limit: number;
}

export interface ListMovementsOutput {
  movements: {
    id: string;
    type: MovementType;
    amount: number;
    createdAt: Date;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ListMovementsUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(MOVEMENT_REPOSITORY)
    private readonly movementRepository: MovementRepositoryPort,
  ) {}

  async execute(input: ListMovementsInput): Promise<ListMovementsOutput> {
    const account = await this.accountRepository.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const { items, total } = await this.movementRepository.findByAccount(
      account.id,
      {
        type: input.type,
        from: input.from ? new Date(input.from) : undefined,
        to: input.to ? new Date(input.to) : undefined,
      },
      { page: input.page, limit: input.limit },
    );

    return {
      movements: items.map((m) => ({
        id: m.id,
        type: m.type,
        amount: m.amount,
        createdAt: m.createdAt,
      })),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }
}
