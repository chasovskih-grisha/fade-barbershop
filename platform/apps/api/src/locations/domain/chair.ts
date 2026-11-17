// Chair — крісло в локації (MNG-ADM-04). На точку рівно 2 крісла
// (інваріант мережі). Неактивне крісло не бере участі в розкладі.

export const CHAIR_LIMIT = 2;

export interface ChairData {
  /** 1 або 2 */
  number: number;
  name: string | null;
  active: boolean;
}

export class Chair {
  private constructor(private readonly data: ChairData) {}

  static of(number: number, name: string | null, active: boolean): Chair {
    if (number < 1 || number > CHAIR_LIMIT) throw new Error('Chair number out of range');
    return new Chair({ number, name, active });
  }

  get number(): number {
    return this.data.number;
  }

  get name(): string | null {
    return this.data.name;
  }

  get active(): boolean {
    return this.data.active;
  }
}
