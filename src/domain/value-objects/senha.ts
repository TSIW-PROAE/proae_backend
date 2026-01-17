export class Senha {
  private readonly hash: string;

  private constructor(hash: string) {
    this.hash = hash;
  }

  static fromHash(hash: string): Senha {
    if (!hash || hash.trim().length === 0) {
      throw new Error('Hash de senha não pode ser vazio');
    }
    return new Senha(hash);
  }

  static validate(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Senha deve ter pelo menos 8 caracteres');
    }

    if (password.length > 128) {
      throw new Error('Senha não pode ter mais de 128 caracteres');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase) {
      throw new Error('Senha deve conter pelo menos uma letra maiúscula');
    }

    if (!hasLowerCase) {
      throw new Error('Senha deve conter pelo menos uma letra minúscula');
    }

    if (!hasNumbers) {
      throw new Error('Senha deve conter pelo menos um número');
    }

    if (!hasSpecialChar) {
      throw new Error('Senha deve conter pelo menos um caractere especial');
    }

    const commonPasswords = [
      'password',
      '12345678',
      'qwerty',
      'abc123',
      'senha123',
      'admin123',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      throw new Error('Senha muito comum. Escolha uma senha mais segura');
    }
  }

  getHash(): string {
    return this.hash;
  }

  equals(other: Senha): boolean {
    return this.hash === other.hash;
  }
}

