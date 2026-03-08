import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CACHE_PORT } from '../core/application/utilities';

@Global()
@Module({
  providers: [RedisService, { provide: CACHE_PORT, useExisting: RedisService }],
  exports: [RedisService, CACHE_PORT],
})
export class RedisModule {}
