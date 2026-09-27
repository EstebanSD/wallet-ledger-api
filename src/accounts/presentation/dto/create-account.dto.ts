import { IsString, Length, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  ownerRef: string;

  // Solo valida longitud (código de 3 letras), no una whitelist ISO 4217 real.
  // A propósito: no hay lógica multi-moneda en este proyecto, así que
  // validar contra la lista completa de códigos sería esfuerzo sin retorno acá.
  @IsString()
  @Length(3, 3, {
    message: 'currency debe ser un código de 3 letras (ISO 4217)',
  })
  currency: string;
}
