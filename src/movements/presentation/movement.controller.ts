import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AccountNotFoundError,
  InsufficientFundsError,
} from '../application/errors';
import { DepositUseCase } from '../application/use-cases/deposit.use-case';
import { WithdrawUseCase } from '../application/use-cases/withdraw.use-case';
import { GetBalanceUseCase } from '../application/use-cases/get-balance.use-case';
import { ListMovementsUseCase } from '../application/use-cases/list-movements.use-case';
import { DepositDto } from './dto/deposit.dto';
import { ListMovementsQueryDto } from './dto/list-movements-query.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('accounts/:accountId')
export class MovementController {
  constructor(
    private readonly depositUseCase: DepositUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
    private readonly getBalanceUseCase: GetBalanceUseCase,
    private readonly listMovementsUseCase: ListMovementsUseCase,
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

  @Get('balance')
  async getBalance(@Param('accountId') accountId: string) {
    try {
      return await this.getBalanceUseCase.execute({ accountId });
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Get('movements')
  async listMovements(
    @Param('accountId') accountId: string,
    @Query() query: ListMovementsQueryDto,
  ) {
    try {
      return await this.listMovementsUseCase.execute({
        accountId,
        type: query.type,
        from: query.from,
        to: query.to,
        page: query.page,
        limit: query.limit,
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
