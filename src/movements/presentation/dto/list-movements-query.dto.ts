import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { MovementType } from '../../domain/entities/movement.entity';

export class ListMovementsQueryDto {
  @IsOptional()
  @IsEnum(MovementType, { message: 'type debe ser CREDIT o DEBIT' })
  type?: MovementType;

  @IsOptional()
  @IsISO8601(
    {},
    { message: 'from debe ser una fecha ISO 8601 (ej: 2026-01-01)' },
  )
  from?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'to debe ser una fecha ISO 8601 (ej: 2026-01-31)' })
  to?: string;

  // @Type requiere ValidationPipe con `transform: true` en main.ts para
  // convertir el string del query param a number antes de validar.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // techo para no permitir limit=999999 y traer la tabla entera
  limit: number = 20;
}
