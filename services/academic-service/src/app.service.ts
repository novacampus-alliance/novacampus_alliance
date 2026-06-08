import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): Record<string, string> {
    return { service: 'academic-service', status: 'ok' };
  }
}
