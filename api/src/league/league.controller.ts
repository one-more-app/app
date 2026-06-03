import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { LeagueService } from './league.service.js';

@UseGuards(JwtAuthGuard)
@Controller('/league')
export class LeagueController {
  constructor(private readonly leagueService: LeagueService) {}

  @Get('/summary')
  async summary(@Req() req: { user: { sub: string } }) {
    return (await this.leagueService.buildSummary(req.user.sub)) ?? null;
  }

  @Get('/browse-lookups')
  async browseLookups(@Req() req: { user: { sub: string } }) {
    return await this.leagueService.buildBrowseLookups(req.user.sub);
  }

  @Get('/exercises/:trackedClientId/tiers')
  async exerciseTiers(
    @Req() req: { user: { sub: string } },
    @Param('trackedClientId') trackedClientId: string,
  ) {
    return await this.leagueService.buildTierLadder(
      req.user.sub,
      trackedClientId,
    );
  }
}
