import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { AccessService } from './access.service.js';
import { RequestFriendDto } from './dto/request-friend.dto.js';
import { SearchUsersQueryDto } from './dto/search-users-query.dto.js';
import { FriendsService } from './friends.service.js';
import { InvitesService } from './invites.service.js';
import { ReferralService } from './referral.service.js';
import { InviteCodeDto } from './dto/invite-code.dto.js';
import { UserSearchService } from './user-search.service.js';

@Controller()
export class SocialController {
  constructor(
    private readonly accessService: AccessService,
    private readonly invitesService: InvitesService,
    private readonly referralService: ReferralService,
    private readonly friendsService: FriendsService,
    private readonly userSearchService: UserSearchService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/me/access')
  async getAccess(@Req() req: { user: { sub: string } }) {
    return await this.accessService.getAccess(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/social/invite-code')
  async getInviteCode(@Req() req: { user: { sub: string } }) {
    return await this.invitesService.getInviteCode(req.user.sub);
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
  @Get('/social/users/search')
  async searchUsers(
    @Req() req: { user: { sub: string } },
    @Query() query: SearchUsersQueryDto,
  ) {
    const results = await this.userSearchService.search(
      req.user.sub,
      query.q,
    );
    return { results };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/social/users/:userId/preview')
  async getUserPreview(
    @Req() req: { user: { sub: string } },
    @Param('userId') userId: string,
  ) {
    return await this.friendsService.getUserPreview(req.user.sub, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/social/friends/request')
  async requestFriend(
    @Req() req: { user: { sub: string } },
    @Body() body: RequestFriendDto,
  ) {
    return await this.friendsService.requestFriend(
      req.user.sub,
      body.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/social/friends/requests/:friendshipId')
  async cancelOutgoingRequest(
    @Req() req: { user: { sub: string } },
    @Param('friendshipId') friendshipId: string,
  ) {
    return await this.friendsService.cancelOutgoingRequest(
      req.user.sub,
      friendshipId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/social/referral/apply')
  async applyReferralCode(
    @Req() req: { user: { sub: string } },
    @Body() body: InviteCodeDto,
  ) {
    return await this.referralService.applyReferralCode(
      req.user.sub,
      body.inviteCode,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/social/friends/request-from-invite')
  async requestFromInvite(
    @Req() req: { user: { sub: string } },
    @Body() body: InviteCodeDto,
  ) {
    return await this.referralService.requestFromInvite(
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
