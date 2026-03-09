import { Controller, Get } from '@nestjs/common';

/**
 * Endpoint de health check para o Render e load balancers.
 * Responde 200 OK rapidamente, sem chamar Redis, DB ou MinIO.
 * Configure em Render: Health Check Path = /health
 */
@Controller()
export class HealthController {
  @Get('health')
  check() {
    return { status: 'ok' };
  }
}
