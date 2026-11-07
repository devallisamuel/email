
type EntityId = string | { value: string };

type EntityProps = {
  id: EntityId;
};

export abstract class Entity<TProps extends EntityProps> {
  protected constructor(protected readonly props: TProps) {}

  get id(): string {
    return typeof this.props.id === 'string'
      ? this.props.id
      : this.props.id.value;
  }

  equals(other?: Entity<TProps>): boolean {
    return Boolean(
      other && this.constructor === other.constructor && this.id === other.id,
    );
  }
}
