export enum MovementType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export class Movement {
  private constructor(
    public readonly id: string,
    public readonly accountId: string,
    public readonly type: MovementType,
    public readonly amount: number,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    accountId: string;
    type: MovementType;
    amount: number;
  }): Movement {
    if (!props.accountId || props.accountId.trim().length === 0) {
      throw new Error('accountId no puede estar vacío');
    }

    if (!Number.isInteger(props.amount)) {
      throw new Error(
        'amount debe ser un entero (unidad mínima de moneda, sin decimales)',
      );
    }

    if (props.amount <= 0) {
      throw new Error('amount debe ser un entero positivo');
    }

    return new Movement(
      props.id,
      props.accountId,
      props.type,
      props.amount,
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    accountId: string;
    type: MovementType;
    amount: number;
    createdAt: Date;
  }): Movement {
    return new Movement(
      props.id,
      props.accountId,
      props.type,
      props.amount,
      props.createdAt,
    );
  }
}
