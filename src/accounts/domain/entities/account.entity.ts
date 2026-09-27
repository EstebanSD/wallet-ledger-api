export class Account {
  private constructor(
    public readonly id: string,
    public readonly ownerRef: string,
    public readonly currency: string,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    ownerRef: string;
    currency: string;
  }): Account {
    if (!props.ownerRef || props.ownerRef.trim().length === 0) {
      throw new Error('ownerRef no puede estar vacío');
    }
    if (!props.currency || props.currency.trim().length === 0) {
      throw new Error('currency no puede estar vacía');
    }
    return new Account(props.id, props.ownerRef, props.currency, new Date());
  }

  // Usado por el repositorio al reconstruir desde persistencia.
  // No valida invariantes de creación: se asume que ya pasó por create() alguna vez.
  static reconstitute(props: {
    id: string;
    ownerRef: string;
    currency: string;
    createdAt: Date;
  }): Account {
    return new Account(
      props.id,
      props.ownerRef,
      props.currency,
      props.createdAt,
    );
  }
}
