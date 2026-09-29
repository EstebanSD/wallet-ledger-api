import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Movement, MovementType } from '../../domain/entities/movement.entity';
import { AccountNotFoundError, InsufficientFundsError } from '../errors';
import {
  LEDGER_UNIT_OF_WORK,
  type LedgerUnitOfWork,
} from '../ports/ledger-unit-of-work.port';

export interface WithdrawInput {
  accountId: string;
  amount: number;
}

export interface WithdrawOutput {
  id: string;
  accountId: string;
  type: MovementType;
  amount: number;
  createdAt: Date;
}

@Injectable()
export class WithdrawUseCase {
  constructor(
    @Inject(LEDGER_UNIT_OF_WORK)
    private readonly unitOfWork: LedgerUnitOfWork,
  ) {}

  async execute(input: WithdrawInput): Promise<WithdrawOutput> {
    return this.unitOfWork.run(async (tx) => {
      // 1. Bloquear la cuenta: desde acá hasta el commit, ningún otro
      //    retiro sobre esta cuenta puede leer el saldo.
      const account = await tx.lockAccount(input.accountId);
      if (!account) {
        throw new AccountNotFoundError(input.accountId);
      }

      // 2. Invariante #1: el saldo nunca puede quedar negativo.
      //    Se chequea con el saldo leído DENTRO del lock, por eso es confiable.
      const balance = await tx.getBalance(account.id);
      if (balance < input.amount) {
        throw new InsufficientFundsError(account.id);
      }

      // 3. Insertar el DEBIT. Si esto o el commit fallan, rollback total.
      const movement = Movement.create({
        id: randomUUID(),
        accountId: account.id,
        type: MovementType.DEBIT,
        amount: input.amount,
      });
      await tx.saveMovement(movement);

      return {
        id: movement.id,
        accountId: movement.accountId,
        type: movement.type,
        amount: movement.amount,
        createdAt: movement.createdAt,
      };
    });
  }
}
