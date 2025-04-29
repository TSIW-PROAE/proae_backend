import { Controller, Post, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { AuthGuard } from './auth.guard';
import { UpdatePasswordDto } from './dto/updatepassword.dto';

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
    @Req() req:any,
    @Body() body: UpdatePasswordDto,
  ) {
    const clerkId = req.user.clerkId
    return this.authService.updatePassword(clerkId, body.password);
  }
}
