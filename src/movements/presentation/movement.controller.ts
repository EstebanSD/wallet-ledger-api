import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  AccountNotFoundError,
  DepositUseCase,
} from '../application/use-cases/deposit.use-case';
import { DepositDto } from './dto/deposit.dto';

@Controller('accounts/:accountId/deposits')
export class MovementController {
  constructor(private readonly depositUseCase: DepositUseCase) {}

  @Post()
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
      if (error instanceof AccountNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
