import { Injectable } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  async signup({
    registrationNumber,
    email,
    password,
    firstName,
    lastName,
  }: SignupDto) {
    try {
      const user = await this.clerk.users.createUser({
        username: `m-${registrationNumber}`,
        emailAddress: [email],
        password,
        firstName,
        lastName,
      });

      return {
        success: true,
        message: 'Cadastro realizado com sucesso',
        data: {
          user: {
            id: user.id,
            email: user.emailAddresses[0].emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            registrationNumber: user.username,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao realizar o cadastro',
        error: error as Error,
      };
    }
  }
}
