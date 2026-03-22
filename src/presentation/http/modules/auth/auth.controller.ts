import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDtoAdmin } from './dto/siginupAdmin.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdatePasswordDto } from './dto/updatepassword.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

/** Remove trailing slash para evitar URL duplicada (ex: https://site.com//admin/aprovado) */
function normalizeFrontendUrl(url: string | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : null;
}

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Cadastro de aluno com email institucional' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ status: 201, description: 'Aluno cadastrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Email ou CPF já cadastrado' })
  async signupAluno(@Body() body: SignupDto) {
    return this.authService.signupAluno(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Req() req, @Res() res) {
    const result = await this.authService.login(req.user);
    const isProd = process.env.NODE_ENV === 'production';
    // clearCookie precisa usar os MESMOS path/secure/sameSite do res.cookie, senão o browser não remove o cookie.
    res.cookie('token', result.access_token, {
      httpOnly: true,
      path: '/',
      // O frontend (Vercel) e o backend (Cloud Run) são domínios diferentes.
      // Para o cookie ser enviado nas requisições do browser, em produção precisamos
      // usar SameSite=None (e cookie precisa ser Secure).
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 3600000,
    });
    return res.status(200).json({ success: true, user: result.user });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout do usuário' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@Res({ passthrough: true }) res) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
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
  @ApiResponse({ status: 200, description: 'Token válido' })
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
  async approveAdmin(@Param('token') token: string, @Res() res) {
    const result = await this.authService.approveAdmin(token);
    const frontendUrl = normalizeFrontendUrl(process.env.FRONTEND_URL);
    const redirectTo = frontendUrl
      ? `${frontendUrl}/admin/aprovado?sucesso=true`
      : null;
    if (redirectTo) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[approve-admin] redirectTo=', redirectTo);
      }
      return res.redirect(redirectTo);
    }
    console.warn(
      '[approve-admin] FRONTEND_URL não configurado. Usuário viu página HTML em vez de redirecionamento. Configure FRONTEND_URL no .env / Cloud Run.',
    );
    return res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>Admin Aprovado</title></head>
      <body><h1>Admin Aprovado com Sucesso!</h1><p>${result.mensagem}</p></body></html>
    `);
  }

  @Get('confirm-cadastro-aluno')
  @ApiOperation({
    summary: 'Confirmar email do cadastro de estudante (link enviado ao próprio aluno)',
  })
  @ApiResponse({ status: 302, description: 'Redireciona para o frontend' })
  async confirmCadastroAluno(@Query('token') token: string, @Res() res) {
    try {
      const raw = token ? decodeURIComponent(token) : '';
      if (!raw) {
        throw new Error('missing token');
      }
      await this.authService.confirmAlunoCadastro(raw);
    } catch {
      const frontendUrl = normalizeFrontendUrl(process.env.FRONTEND_URL);
      const errTo = frontendUrl
        ? `${frontendUrl}/aluno/cadastro-confirmado?erro=1`
        : null;
      if (errTo) {
        return res.redirect(errTo);
      }
      return res
        .status(400)
        .send(
          '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><p>Link inválido ou expirado.</p></body></html>',
        );
    }
    const frontendUrl = normalizeFrontendUrl(process.env.FRONTEND_URL);
    const redirectTo = frontendUrl
      ? `${frontendUrl}/aluno/cadastro-confirmado?sucesso=true`
      : null;
    if (redirectTo) {
      return res.redirect(redirectTo);
    }
    return res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>Email confirmado</title></head>
      <body><h1>Email confirmado!</h1><p>Você já pode fazer login no portal do estudante.</p></body></html>
    `);
  }

  @Get('reject-admin/:token')
  @ApiOperation({ summary: 'Rejeitar cadastro de admin via token' })
  @ApiResponse({ status: 200, description: 'Admin rejeitado e removido' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async rejectAdmin(@Param('token') token: string, @Res() res) {
    const result = await this.authService.rejectAdmin(token);
    const frontendUrl = normalizeFrontendUrl(process.env.FRONTEND_URL);
    const redirectTo = frontendUrl
      ? `${frontendUrl}/admin/rejeitado?sucesso=true`
      : null;
    if (redirectTo) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[reject-admin] redirectTo=', redirectTo);
      }
      return res.redirect(redirectTo);
    }
    console.warn(
      '[reject-admin] FRONTEND_URL não configurado. Configure FRONTEND_URL no .env / Cloud Run.',
    );
    return res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>Admin Rejeitado</title></head>
      <body><h1>Admin Rejeitado</h1><p>${result.mensagem}</p></body></html>
    `);
  }
}
