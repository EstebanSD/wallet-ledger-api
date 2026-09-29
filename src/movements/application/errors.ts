// Errores de dominio, no de framework: los use cases no conocen HttpException
// ni nada de @nestjs/common relacionado a HTTP. El controller decide cómo
// se traducen (404, 422, etc.) — acá solo se modela "esto pasó en el dominio".

export class AccountNotFoundError extends Error {
  constructor(accountId: string) {
    super(`Cuenta ${accountId} no encontrada`);
    this.name = 'AccountNotFoundError';
  }
}

// El mensaje no incluye el saldo a propósito: sin auth, cualquiera podría
// deducir el balance de una cuenta probando montos.
export class InsufficientFundsError extends Error {
  constructor(accountId: string) {
    super(`Saldo insuficiente en la cuenta ${accountId}`);
    this.name = 'InsufficientFundsError';
  }
}
