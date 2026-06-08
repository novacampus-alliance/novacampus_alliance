import { Controller, Get } from '@nestjs/common';

/**
 * Endpoints propres au gateway (non proxifiés vers les services métiers).
 */
@Controller()
export class AppController {
  /**
   * GET /health — santé du gateway (utilisé par Docker / monitoring).
   */
  @Get('health')
  health() {
    return {
      service: 'api-gateway',
      status: 'ok',
      architecture: 'SOA',
    };
  }

  /**
   * GET / — documentation rapide des routes disponibles.
   */
  @Get()
  index() {
    return {
      service: 'api-gateway',
      message: 'Point d entree unique SOA Novacampus Alliance',
      routes: {
        academic: '/api/auth, /api/campus',
        billing: '/api/payments',
        notification: '/api/notifications',
        ai: '/api/v1',
      },
    };
  }
}
