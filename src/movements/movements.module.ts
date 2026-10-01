import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { LEDGER_UNIT_OF_WORK } from './application/ports/ledger-unit-of-work.port';
import { MOVEMENT_REPOSITORY } from './application/ports/movement-repository.port';
import { BALANCE_CACHE } from './application/ports/balance-cache.port';
import { DepositUseCase } from './application/use-cases/deposit.use-case';
import { WithdrawUseCase } from './application/use-cases/withdraw.use-case';
import { GetBalanceUseCase } from './application/use-cases/get-balance.use-case';
import { MovementOrmEntity } from './infrastructure/persistence/movement.orm-entity';
import { TypeOrmLedgerUnitOfWork } from './infrastructure/persistence/typeorm-ledger-unit-of-work';
import { TypeOrmMovementRepository } from './infrastructure/persistence/typeorm-movement.repository';
import { redisClientProvider } from './infrastructure/cache/redis-client.provider';
import { RedisBalanceCache } from './infrastructure/cache/redis-balance-cache';
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
    GetBalanceUseCase,
    { provide: MOVEMENT_REPOSITORY, useClass: TypeOrmMovementRepository },
    { provide: LEDGER_UNIT_OF_WORK, useClass: TypeOrmLedgerUnitOfWork },
    redisClientProvider,
    { provide: BALANCE_CACHE, useClass: RedisBalanceCache },
  ],
})
export class MovementsModule {}
