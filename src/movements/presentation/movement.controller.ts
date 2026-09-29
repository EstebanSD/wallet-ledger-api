import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AccountNotFoundError,
  InsufficientFundsError,
} from '../application/errors';
import { DepositUseCase } from '../application/use-cases/deposit.use-case';
import { WithdrawUseCase } from '../application/use-cases/withdraw.use-case';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('accounts/:accountId')
export class MovementController {
  constructor(
    private readonly depositUseCase: DepositUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
  ) {}

  @Post('deposits')
  @HttpCode(HttpStatus.CREATED)
  async deposit(
    @Param('accountId') accountId: string,
    @Body() dto: DepositDto,
  ) {
    try {
      return await this.depositUseCase.execute({
        accountId,
        amount: dto.amount,
      });
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Post('withdrawals')
  @HttpCode(HttpStatus.CREATED)
  async withdraw(
    @Param('accountId') accountId: string,
    @Body() dto: WithdrawDto,
  ) {
    try {
      return await this.withdrawUseCase.execute({
        accountId,
        amount: dto.amount,
      });
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  // Único lugar donde los errores de dominio se traducen a HTTP.
  // 422 para saldo insuficiente: el request está bien formado pero viola
  // una regla de negocio (no es 400 de formato, ni 409 de conflicto de estado).
  private toHttpError(error: unknown): unknown {
    if (error instanceof AccountNotFoundError) {
      return new NotFoundException(error.message);
    }
    if (error instanceof InsufficientFundsError) {
      return new UnprocessableEntityException(error.message);
    }
    return error;
  }
}
