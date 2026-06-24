import { type Vector } from "./vector.ts";

export type Model = {
  eval(x: number): number;
};

/**
 * A polynomial of arbitrary degree, with specialised fast subclasses for the
 * low degrees keybr fits (0..3). Faithful port of keybr's polynomial model.
 */
export abstract class Polynomial implements Model {
  static from(coef: readonly number[]): Polynomial {
    coef = trimZeros(coef);
    switch (coef.length) {
      case 0:
        throw new Error("Empty coefficients.");
      case 1:
        return new Polynomial0(coef[0]); // Constant.
      case 2:
        return new Polynomial1(coef[0], coef[1]); // Linear.
      case 3:
        return new Polynomial2(coef[0], coef[1], coef[2]); // Quadratic.
      case 4:
        return new Polynomial3(coef[0], coef[1], coef[2], coef[3]); // Cubic.
      default:
        return new PolynomialN(coef);
    }
  }

  readonly coef: readonly number[];
  readonly degree: number;

  constructor(coef: readonly number[]) {
    this.coef = coef;
    this.degree = coef.length - 1;
  }

  abstract eval(x: number): number;

  abstract derivative(): Polynomial;
}

export class Polynomial0 extends Polynomial {
  constructor(readonly y: number) {
    super([y]);
  }

  override eval(_x: number): number {
    return this.y;
  }

  override derivative(): Polynomial {
    return new Polynomial0(0);
  }
}

export class Polynomial1 extends Polynomial {
  constructor(
    readonly a: number,
    readonly b: number,
  ) {
    super([a, b]);
  }

  override eval(x: number): number {
    return this.a + this.b * x;
  }

  override derivative(): Polynomial {
    return new Polynomial0(this.b);
  }
}

export class Polynomial2 extends Polynomial {
  constructor(
    readonly a: number,
    readonly b: number,
    readonly c: number,
  ) {
    super([a, b, c]);
  }

  override eval(x: number): number {
    return this.a + this.b * x + this.c * x * x;
  }

  override derivative(): Polynomial {
    return new Polynomial1(this.b, this.c * 2);
  }
}

export class Polynomial3 extends Polynomial {
  constructor(
    readonly a: number,
    readonly b: number,
    readonly c: number,
    readonly d: number,
  ) {
    super([a, b, c, d]);
  }

  override eval(x: number): number {
    return this.a + this.b * x + this.c * x * x + this.d * x * x * x;
  }

  override derivative(): Polynomial {
    return new Polynomial2(this.b, this.c * 2, this.d * 3);
  }
}

export class PolynomialN extends Polynomial {
  constructor(coef: readonly number[]) {
    super(coef);
  }

  override eval(x: number): number {
    const { coef } = this;
    const { length } = coef;
    let y = 0;
    for (let i = length - 1; i > 0; i--) {
      y = (y + coef[i]) * x;
    }
    return y + coef[0];
  }

  override derivative(): Polynomial {
    const { coef } = this;
    const { length } = coef;
    const derivativeCoef = new Array<number>(length - 1);
    for (let i = 1; i < length; i++) {
      derivativeCoef[i - 1] = coef[i] * i;
    }
    return Polynomial.from(derivativeCoef);
  }
}

function trimZeros(coef: readonly number[]): number[] {
  let i = coef.length;
  while (i > 1 && coef[i - 1] === 0) {
    i = i - 1;
  }
  return coef.slice(0, i);
}

/**
 * Coefficient of determination (R²) of a model against observed data.
 * @see https://en.wikipedia.org/wiki/Coefficient_of_determination
 */
export function r2(vx: Vector, vy: Vector, model: Model): number {
  const { length } = vx;
  if (length !== vy.length) {
    throw new Error();
  }
  if (length === 0) {
    throw new Error();
  }
  let sy = 0;
  for (let i = 0; i < length; i++) {
    sy = sy + vy.at(i);
  }
  const my = sy / length;
  let ssres = 0;
  let sstot = 0;
  for (let i = 0; i < length; i++) {
    const t0 = vy.at(i) - model.eval(vx.at(i));
    const t1 = vy.at(i) - my;
    ssres = ssres + t0 * t0;
    sstot = sstot + t1 * t1;
  }
  return 1 - ssres / sstot;
}
