import { ValueObject } from './value-object';

type MoneyProps = {
  amount: number;
  currency: string;
};

class Money extends ValueObject<MoneyProps> {
  constructor(props: MoneyProps) {
    super(props);
  }
}

class Quantity extends ValueObject<{ amount: number; currency: string }> {
  constructor(props: { amount: number; currency: string }) {
    super(props);
  }
}

describe('ValueObject', () => {
  it('considers values with equal properties equal', () => {
    const first = new Money({ amount: 100, currency: 'NGN' });
    const second = new Money({ amount: 100, currency: 'NGN' });

    expect(first.equals(second)).toBe(true);
  });

  it('does not consider values of different types equal', () => {
    const money = new Money({ amount: 100, currency: 'NGN' });
    const quantity = new Quantity({ amount: 100, currency: 'NGN' });

    expect(money.equals(quantity)).toBe(false);
  });

  it('does not expose mutable properties', () => {
    const money = new Money({ amount: 100, currency: 'NGN' });

    expect(Object.isFrozen(money.getValue())).toBe(true);
  });
});
