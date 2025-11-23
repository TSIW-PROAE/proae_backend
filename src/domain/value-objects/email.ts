export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!email || email.trim().length === 0) {
      throw new Error('Email não pode ser vazio');
    }

    const trimmedEmail = email.toLowerCase().trim();

    if (!this.isValid(trimmedEmail)) {
      throw new Error('Email inválido');
    }

    this.value = trimmedEmail;
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

