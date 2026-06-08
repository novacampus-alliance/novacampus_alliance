import { Controller, Get } from '@nestjs/common';

/**
 * Endpoints propres au gateway (non proxifiÃ©s vers les services mÃ©tiers).
 */
@Controller()
export class AppController {
  /**
   * GET /health â€” santÃ© du gateway (utilisÃ© par Docker / monitoring).
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
   * GET / â€” documentation rapide des routes disponibles.
   */
  @Get()
  index() {
    return {
      service: 'api-gateway',
      message: 'Point d entree unique SOA Novacampus Alliance',
      routes: {
        academic: '/api/auth, /api/campus, /api/programs, /api/schedules',
        billing: '/api/payments',
        notification: '/api/notifications',
        ai: '/api/v1',
      },
    };
  }
}
