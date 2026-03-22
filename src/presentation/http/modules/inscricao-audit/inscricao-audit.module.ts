import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscricaoStatusAuditLog } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao-status-audit-log.entity';
import { InscricaoAuditLogService } from './inscricao-audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([InscricaoStatusAuditLog])],
  providers: [InscricaoAuditLogService],
  exports: [InscricaoAuditLogService, TypeOrmModule],
})
export class InscricaoAuditModule {}
