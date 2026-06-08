import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** GET /api — santé du service académique */
  @Get()
  getHello() {
    return this.appService.getHello();
  }
}
