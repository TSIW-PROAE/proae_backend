import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './infrastructure/persistence/typeorm/db.config';
import { HttpModule } from './presentation/http/http.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      ...typeOrmConfig,
      retryAttempts: 5,
      retryDelay: 3000,
      autoLoadEntities: true,
    }),
    InfrastructureModule,
    HttpModule,
  ],
})
export class AppModule {}
