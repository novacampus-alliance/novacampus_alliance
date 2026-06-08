import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return { service: 'billing-service', status: 'ok' };
  }
}
