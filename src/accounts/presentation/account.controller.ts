import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateAccountUseCase } from '../application/use-cases/create-account.use-case';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('accounts')
export class AccountController {
  constructor(private readonly createAccountUseCase: CreateAccountUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAccountDto) {
    return this.createAccountUseCase.execute({
      ownerRef: dto.ownerRef,
      currency: dto.currency,
    });
  }
}
