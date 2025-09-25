import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

import { Edital } from '../entities/edital/edital.entity';
import { EditalController } from './edital.controller';
import { EditalService } from './edital.service';

@Module({
  imports: [TypeOrmModule.forFeature([Edital]), forwardRef(() => AuthModule)],
  controllers: [EditalController],
  providers: [EditalService],
})
export class EditalModule {}
