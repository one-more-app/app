import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { ClaimTshirtDto } from './dto/claim-tshirt.dto.js';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard.js';
import { RewardsService } from './rewards.service.js';

@Controller()
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/me/rewards/tshirt')
  async getTshirtReward(@Req() req: { user: { sub: string } }) {
    return await this.rewardsService.getTshirtRewardStatus(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/me/rewards/tshirt/claim')
  async claimTshirt(
    @Req() req: { user: { sub: string } },
    @Body() body: ClaimTshirtDto,
  ) {
    return await this.rewardsService.claimTshirt(req.user.sub, body);
  }
}

@Controller('/admin/rewards')
export class AdminRewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @UseGuards(AdminApiKeyGuard)
  @Get('/tshirt')
  async listTshirtClaims() {
    const claims = await this.rewardsService.listTshirtClaimsForAdmin();
    return { claims };
  }
}
