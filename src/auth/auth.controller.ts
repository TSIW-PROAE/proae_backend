import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import AuthenticatedRequest from 'src/types/authenticated-request.interface';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { UpdatePasswordDto } from './dto/updatepassword.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @ApiBearerAuth()
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
