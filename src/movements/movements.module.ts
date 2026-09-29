import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { LEDGER_UNIT_OF_WORK } from './application/ports/ledger-unit-of-work.port';
import { MOVEMENT_REPOSITORY } from './application/ports/movement-repository.port';
import { DepositUseCase } from './application/use-cases/deposit.use-case';
import { WithdrawUseCase } from './application/use-cases/withdraw.use-case';
import { MovementOrmEntity } from './infrastructure/persistence/movement.orm-entity';
import { TypeOrmLedgerUnitOfWork } from './infrastructure/persistence/typeorm-ledger-unit-of-work';
import { TypeOrmMovementRepository } from './infrastructure/persistence/typeorm-movement.repository';
import { MovementController } from './presentation/movement.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MovementOrmEntity]),
    AccountsModule, // para inyectar ACCOUNT_REPOSITORY en DepositUseCase
  ],
  controllers: [MovementController],
  providers: [
    DepositUseCase,
    WithdrawUseCase,
    { provide: MOVEMENT_REPOSITORY, useClass: TypeOrmMovementRepository },
    { provide: LEDGER_UNIT_OF_WORK, useClass: TypeOrmLedgerUnitOfWork },
  ],
})
export class MovementsModule {}
