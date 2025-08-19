import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import AuthenticatedRequest from 'src/types/authenticated-request.interface';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/updatepassword.dto';
import { CompleteGoogleSignupDto } from './dto/complete-google-signup.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Cadastro com email institucional' })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro de validação' })
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          aluno_id: 1,
          email: 'aluno@ufba.br',
          matricula: '202301234',
          nome: 'João',
          sobrenome: 'da Silva',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  @ApiOperation({ summary: 'Atualizar senha do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Senha atualizada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async updatePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    const { userId } = request.user;
    return this.authService.updatePassword(userId, body.senha);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar link de recuperação de senha' })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperação enviado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Email não encontrado' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Resetar a senha usando token' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  @ApiResponse({ status: 400, description: 'Usuário não encontrado' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redireciona para login via Google' })
  async googleAuth(@Req() req) {
    // Redireciona automaticamente para Google OAuth
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback do login via Google' })
  @ApiResponse({
    status: 200,
    description: 'Resposta da autenticação Google',
    schema: {
      example: {
        success: true,
        access_token: 'eyJhbGciOi...',
        user: {
          id: 1,
          nome: 'João Google',
          email: 'joao@ufba.br',
        },
        message: 'Login realizado com sucesso via Google',
      },
    },
  })
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.googleLogin(req.user);

    if (result.needsRegistration) {
      return res.status(200).json({
        needsRegistration: true,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        message: 'Complete seu cadastro com as informações adicionais',
        nextStep: 'POST /auth/complete-google-signup',
      });
    }

    return res.status(200).json({
      success: true,
      access_token: result.access_token,
      user: result.user,
      message: 'Login realizado com sucesso via Google',
    });
  }

  @Post('complete-google-signup')
  @ApiOperation({ summary: 'Finalizar cadastro após login via Google' })
  @ApiBody({ type: CompleteGoogleSignupDto })
  @ApiResponse({
    status: 201,
    description: 'Cadastro finalizado com sucesso após login via Google',
  })
  async completeGoogleSignup(
    @Body() completeSignupDto: CompleteGoogleSignupDto,
  ) {
    return this.authService.completeGoogleSignup(completeSignupDto);
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Validar token JWT' })
  @ApiBody({ type: ValidateTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
    schema: {
      example: {
        valid: true,
        user: {
          aluno_id: 1,
          email: 'aluno@ufba.br',
          matricula: '202301234',
          nome: 'João',
          sobrenome: 'da Silva',
          nomeCompleto: 'João da Silva',
          pronome: 'ele/dele',
          data_nascimento: '2000-01-01',
          curso: 'Ciência da computação',
          campus: 'Salvador',
          cpf: '111.444.777-35',
          data_ingresso: '2023-01-02',
          celular: '+5584999999999',
        },
        payload: {
          sub: 1,
          email: 'aluno@ufba.br',
          aluno_id: 1,
          iat: 1640995200,
          exp: 1641081600,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token inválido',
    schema: {
      example: {
        valid: false,
        error: 'Token inválido ou expirado',
      },
    },
  })
  async validateToken(@Body() body: ValidateTokenDto) {
    return this.authService.validateToken(body.token);
  }
}
