import { Global, Module } from '@nestjs/common';
import { CACHE_PORT } from '../../../../core/application/utilities/utility.tokens';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService, { provide: CACHE_PORT, useExisting: RedisService }],
  exports: [RedisService, CACHE_PORT],
})
export class RedisModule {}
