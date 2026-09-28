import { IsInt, IsPositive } from 'class-validator';

export class DepositDto {
  // Unidad mínima de la moneda (ej: centavos), nunca decimales.
  @IsInt({
    message:
      'amount debe ser un entero, sin decimales (unidad mínima de la moneda)',
  })
  @IsPositive({ message: 'amount debe ser mayor a cero' })
  amount: number;
}
