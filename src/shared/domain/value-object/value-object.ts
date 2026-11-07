/**
 * Base class for domain values identified by their contents rather than an id.
 *
 * A subclass should expose meaningful, read-only values from `props`; it should
 * not expose a way to mutate them after construction.
 */
export abstract class ValueObject<TProps extends object> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  getValue(): Readonly<TProps> {
    return this.props;
  }

  equals(other?: ValueObject<TProps>): boolean {
    if (!other || this.constructor !== other.constructor) {
      return false;
    }

    return ValueObject.areEqual(this.props, other.props);
  }

  private static areEqual(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) {
      return true;
    }

    if (left instanceof Date && right instanceof Date) {
      return left.getTime() === right.getTime();
    }

    if (!ValueObject.isObject(left) || !ValueObject.isObject(right)) {
      return false;
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        ValueObject.areEqual(left[key], right[key]),
    );
  }

  private static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
