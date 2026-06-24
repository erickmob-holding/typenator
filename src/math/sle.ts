// Gaussian-elimination solver ported from keybr (originally MIT, Tom Alexander).
type Row = Array<number>;
type Matrix = Array<Row>;

/**
 * A system of linear equations which solves `A * x = y` for `x`, where `A` is an
 * input matrix and `y` is an input vector. Used to fit polynomial regressions.
 */
export class Sle {
  readonly size: number;
  readonly A: Matrix;
  readonly y: Row;

  constructor(size: number) {
    const A = new Array<Row>(size + 1);
    for (let i = 0; i < size; i++) {
      A[i] = new Array<number>(size).fill(0);
    }
    const y = new Array<number>(size).fill(0);
    A[size] = y;
    this.size = size;
    this.A = A;
    this.y = y;
  }

  solve(): Row {
    const { size, A } = this;

    for (let i = 0; i < size; i++) {
      let maxrow = i;
      for (let j = i + 1; j < size; j++) {
        if (Math.abs(A[i][j]) > Math.abs(A[i][maxrow])) {
          maxrow = j;
        }
      }

      for (let k = i; k < size + 1; k++) {
        const tmp = A[k][i];
        A[k][i] = A[k][maxrow];
        A[k][maxrow] = tmp;
      }

      for (let j = i + 1; j < size; j++) {
        for (let k = size; k >= i; k--) {
          A[k][j] -= (A[k][i] * A[i][j]) / A[i][i];
        }
      }
    }

    const x = new Array<number>(size);
    for (let j = size - 1; j >= 0; j--) {
      let s = 0;
      for (let k = j + 1; k < size; k++) {
        s += A[k][j] * x[k];
      }
      x[j] = (A[size][j] - s) / A[j][j];
    }
    return x;
  }
}
