import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { parseYearMonth } from './lib/month-bounds.js';
import { RankingService } from './ranking.service.js';

/** Mois courant `YYYY-MM` en UTC (défaut serveur ; le client passe toujours le mois). */
function currentUtcMonth(): string {
  const now = new Date();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${now.getUTCFullYear()}-${m}`;
}

function resolveMonth(month: string | undefined): string {
  const value = month?.trim() || currentUtcMonth();
  try {
    parseYearMonth(value);
  } catch {
    throw new BadRequestException('Paramètre month invalide (YYYY-MM).');
  }
  return value;
}

@UseGuards(JwtAuthGuard)
@Controller('/ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('/friends')
  async friends(
    @Req() req: { user: { sub: string } },
    @Query('month') month?: string,
  ) {
    return await this.rankingService.listFriendsRanking(
      req.user.sub,
      resolveMonth(month),
    );
  }

  @Get('/gym')
  async gym(
    @Req() req: { user: { sub: string } },
    @Query('month') month?: string,
  ) {
    return await this.rankingService.listGymRanking(
      req.user.sub,
      resolveMonth(month),
    );
  }

  @Get('/me/recap')
  async recap(
    @Req() req: { user: { sub: string } },
    @Query('month') month?: string,
  ) {
    return await this.rankingService.recap(req.user.sub, resolveMonth(month));
  }
}
