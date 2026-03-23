import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscricaoStatusAuditLog } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao-status-audit-log.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';
import { InscricaoAuditLogService } from './inscricao-audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([InscricaoStatusAuditLog, Usuario])],
  providers: [InscricaoAuditLogService],
  exports: [InscricaoAuditLogService, TypeOrmModule],
})
export class InscricaoAuditModule {}
