import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import AuthenticatedRequest from 'src/types/authenticated-request.interface';
import { SignupDto } from './dto/signup.dto';
import { SignupDtoAdmin } from './dto/siginupAdmin.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/updatepassword.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Cadastro de aluno com email institucional' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'Aluno cadastrado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Email ou CPF já cadastrado' })
  async signupAluno(@Body() body: SignupDto) {
    return this.authService.signupAluno(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido',
  })

  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Req() req, @Res() res) {
    const result = await this.authService.login(req.user);
    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 3600000, // 1 hora
    });
    return res.status(200).json({ success: true, user: result.user });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
  })
  async logout(@Res({ passthrough: true }) res) {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'Strict' });
    return this.authService.logout();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  @ApiOperation({ summary: 'Atualizar senha do usuário autenticado' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: 'Senha atualizada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async updatePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(request.user.userId, body.senha);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar link de recuperação de senha' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperação enviado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Email não encontrado' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Resetar senha usando token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  @ApiResponse({ status: 400, description: 'Senhas não coincidem' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('validate-token')
  @ApiOperation({ summary: 'Validar token JWT do cookie' })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  async validateToken(@Req() request: AuthenticatedRequest) {
    return this.authService.validateToken(request.cookies.token || '');
  }

  @Post('signup-admin')
  @ApiOperation({ summary: 'Cadastro de novo admin (aguardando aprovação)' })
  @ApiBody({ type: SignupDtoAdmin })
  @ApiResponse({
    status: 201,
    description: 'Admin cadastrado com sucesso, aguardando aprovação',
  })
  @ApiResponse({ status: 400, description: 'Email já cadastrado' })
  async signupAdmin(@Body() dto: SignupDtoAdmin) {
    return this.authService.signupAdmin(dto);
  }

  @Get('approve-admin/:token')
  @ApiOperation({ summary: 'Aprovar cadastro de admin via token' })
  @ApiResponse({ status: 200, description: 'Admin aprovado com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async approveAdmin(@Param('token') token: string) {
    return await this.authService.approveAdmin(token);
  }

  @Get('reject-admin/:token')
  @ApiOperation({ summary: 'Rejeitar cadastro de admin via token' })
  @ApiResponse({ status: 200, description: 'Admin rejeitado e removido' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async rejectAdmin(@Param('token') token: string) {
    return await this.authService.rejectAdmin(token);
  }
}
