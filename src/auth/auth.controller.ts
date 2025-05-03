import { Controller, Post, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { AuthGuard } from './auth.guard';
import { UpdatePasswordDto } from './dto/updatepassword.dto';
import AuthenticatedRequest from 'src/types/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @UseGuards(AuthGuard)
  @Patch('update-password')
  async updatePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    console.log('clerkId', request.user);
    const {id} = request.user;
    return this.authService.updatePassword(id, body.senha);
  }
}
