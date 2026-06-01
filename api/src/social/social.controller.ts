import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { AccessService } from './access.service.js';
import { FriendsService } from './friends.service.js';
import { InvitesService } from './invites.service.js';
import { InviteCodeDto } from './dto/invite-code.dto.js';
import { Body } from '@nestjs/common';

@Controller()
export class SocialController {
  constructor(
    private readonly accessService: AccessService,
    private readonly invitesService: InvitesService,
    private readonly friendsService: FriendsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/me/access')
  async getAccess(@Req() req: { user: { sub: string } }) {
    return await this.accessService.getAccess(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/social/invite-link')
  async getInviteLink(@Req() req: { user: { sub: string } }) {
    return await this.invitesService.getInviteLink(req.user.sub);
  }

  @Get('/social/invite/:code/preview')
  async getInvitePreview(@Param('code') code: string) {
    return await this.invitesService.getInvitePreview(code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/social/friends/request-from-invite')
  async requestFromInvite(
    @Req() req: { user: { sub: string } },
    @Body() body: InviteCodeDto,
  ) {
    return await this.friendsService.requestFromInvite(
      req.user.sub,
      body.inviteCode,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/social/friends')
  async listFriends(@Req() req: { user: { sub: string } }) {
    return await this.friendsService.listFriends(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/social/friends/:id/accept')
  async accept(
    @Req() req: { user: { sub: string } },
    @Param('id') friendshipId: string,
  ) {
    return await this.friendsService.accept(req.user.sub, friendshipId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/social/friends/:id/decline')
  async decline(
    @Req() req: { user: { sub: string } },
    @Param('id') friendshipId: string,
  ) {
    return await this.friendsService.decline(req.user.sub, friendshipId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/social/friends/:userId')
  async remove(
    @Req() req: { user: { sub: string } },
    @Param('userId') otherUserId: string,
  ) {
    return await this.friendsService.remove(req.user.sub, otherUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/social/friends/:userId/profile')
  async getFriendProfile(
    @Req() req: { user: { sub: string } },
    @Param('userId') friendUserId: string,
  ) {
    return await this.friendsService.getFriendProfile(
      req.user.sub,
      friendUserId,
    );
  }
}
