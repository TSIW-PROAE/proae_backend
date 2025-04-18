import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { StudentService } from './student.service';
import AuthenticatedRequest from '../types/authenticated-request.interface';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findOne(@Req() request: AuthenticatedRequest) {
    const { id } = request.user;
    return this.studentService.findByClerkId(id);
  }
}
