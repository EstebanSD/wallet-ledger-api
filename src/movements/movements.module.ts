import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { DepositUseCase } from './application/use-cases/deposit.use-case';
import { MOVEMENT_REPOSITORY } from './application/ports/movement-repository.port';
import { TypeOrmMovementRepository } from './infrastructure/persistence/typeorm-movement.repository';
import { MovementOrmEntity } from './infrastructure/persistence/movement.orm-entity';
import { MovementController } from './presentation/movement.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MovementOrmEntity]),
    AccountsModule, // para inyectar ACCOUNT_REPOSITORY en DepositUseCase
  ],
  controllers: [MovementController],
  providers: [
    DepositUseCase,
    {
      provide: MOVEMENT_REPOSITORY,
      useClass: TypeOrmMovementRepository,
    },
  ],
})
export class MovementsModule {}
