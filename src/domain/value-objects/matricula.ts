export class Matricula {
  private readonly value: string;

  constructor(matricula: string) {
    if (!matricula || matricula.trim().length === 0) {
      throw new Error('Matrícula não pode ser vazia');
    }

    const trimmed = matricula.trim();

    if (trimmed.length < 3) {
      throw new Error('Matrícula deve ter pelo menos 3 caracteres');
    }

    if (trimmed.length > 50) {
      throw new Error('Matrícula não pode ter mais de 50 caracteres');
    }

    this.value = trimmed;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Matricula): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

