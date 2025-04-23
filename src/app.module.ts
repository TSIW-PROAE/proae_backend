import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AlunoModule } from './aluno/aluno.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './db/db.config';
import { EditalModule } from './edital/edital.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    AlunoModule,
    EditalModule,
  ],
})
export class AppModule { }
