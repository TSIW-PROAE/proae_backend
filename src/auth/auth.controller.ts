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
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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
          id: 1,
          nome: 'João da Silva',
          email: 'aluno@ufba.br',
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
}
