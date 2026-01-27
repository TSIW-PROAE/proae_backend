export class DataNascimento {
  private readonly value: Date;

  constructor(data: Date | string) {
    const date = typeof data === 'string' ? new Date(data) : data;

    if (isNaN(date.getTime())) {
      throw new Error('Data de nascimento inválida');
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (date > hoje) {
      throw new Error('Data de nascimento não pode ser no futuro');
    }

    const idadeMinima = new Date();
    idadeMinima.setFullYear(idadeMinima.getFullYear() - 120);

    if (date < idadeMinima) {
      throw new Error('Data de nascimento inválida');
    }

    this.value = date;
  }

  getValue(): Date {
    return new Date(this.value);
  }

  getIdade(): number {
    const hoje = new Date();
    let idade = hoje.getFullYear() - this.value.getFullYear();
    const mes = hoje.getMonth() - this.value.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < this.value.getDate())) {
      idade--;
    }

    return idade;
  }

  isMaiorDeIdade(): boolean {
    return this.getIdade() >= 18;
  }

  getFormatted(): string {
    return this.value.toISOString().split('T')[0];
  }

  equals(other: DataNascimento): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  toString(): string {
    return this.getFormatted();
  }
}

