import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './presentation/account.controller';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case';
import { ACCOUNT_REPOSITORY } from './application/ports/account-repository.port';
import { TypeOrmAccountRepository } from './infrastructure/persistence/typeorm-account.repository';
import { AccountOrmEntity } from './infrastructure/persistence/account.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountOrmEntity])],
  controllers: [AccountController],
  providers: [
    CreateAccountUseCase,
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: TypeOrmAccountRepository,
    },
  ],
})
export class AccountsModule {}
