import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Module Redis global — injectable dans Auth, Campus, etc.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
