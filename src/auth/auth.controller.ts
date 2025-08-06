import { Body, Controller, Inject, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import AuthenticatedRequest from 'src/types/authenticated-request.interface';
import { SignupDto } from './dto/signup.dto';
import { UpdatePasswordDto } from './dto/updatepassword.dto';
import { ISignup, IUpdatePassword } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { SIGNUP_SERVICE, UPDATE_PASSWORD_SERVICE } from './auth.tokens';
import { Public } from '../common/decorators/public';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(SIGNUP_SERVICE) private readonly signUpService: ISignup,
    @Inject(UPDATE_PASSWORD_SERVICE) private readonly updatePasswordService: IUpdatePassword,
  ) {}

  @Public()
  @Post('signup')
  async signUp(@Body() body: SignupDto) {
    return this.signUpService.signUp(body);
  }

  @Public()
  @Post('signin')
  async signIn(@Body() body: SignInDto) {
    return this.signUpService.signIn(body);
  }

  @ApiBearerAuth()
  @Patch('update-password')
  async updatePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    const { id } = request.user;
    return this.updatePasswordService.updatePassword(id, body.senha);
  }
}
