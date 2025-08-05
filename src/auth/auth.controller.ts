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
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import AuthenticatedRequest from 'src/types/authenticated-request.interface';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { UpdatePasswordDto } from './dto/updatepassword.dto';
import { CompleteGoogleSignupDto } from './dto/complete-google-signup.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  async updatePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    console.log('userId', request.user);
    const { userId } = request.user;
    return this.authService.updatePassword(userId, body.senha);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Redireciona automaticamente para Google OAuth
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.googleLogin(req.user);

    if (result.needsRegistration) {
      // Retorna JSON com dados para completar cadastro
      return res.status(200).json({
        needsRegistration: true,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        message: 'Complete seu cadastro com as informações adicionais',
        nextStep: 'POST /auth/complete-google-signup',
      });
    }

    // Login bem-sucedido - retorna token
    return res.status(200).json({
      success: true,
      access_token: result.access_token,
      user: result.user,
      message: 'Login realizado com sucesso via Google',
    });
  }

  @Post('complete-google-signup')
  async completeGoogleSignup(
    @Body() completeSignupDto: CompleteGoogleSignupDto,
  ) {
    return this.authService.completeGoogleSignup(completeSignupDto);
  }
}
