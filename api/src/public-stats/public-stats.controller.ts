import { Controller, Get, Header } from '@nestjs/common';
import { PublicStatsService } from './public-stats.service.js';

@Controller('/public/stats')
export class PublicStatsController {
  constructor(private readonly publicStats: PublicStatsService) {}

  @Get('/personal-records')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  async getPersonalRecordsCount(): Promise<string> {
    const count = await this.publicStats.getTotalPersonalRecordsCount();
    return String(count);
  }
}
