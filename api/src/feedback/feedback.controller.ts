import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { CreateReviewFeedbackDto } from './dto/create-review-feedback.dto.js';
import { FeedbackService } from './feedback.service.js';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Req() req: { user: { sub: string; email: string | null } },
    @Body() body: CreateFeedbackDto,
  ): Promise<{ ok: true }> {
    await this.feedbackService.create(req.user.sub, req.user.email, body);
    return { ok: true };
  }

  @Post('review')
  async createReview(
    @Req() req: { user: { sub: string; email: string | null } },
    @Body() body: CreateReviewFeedbackDto,
  ): Promise<{ ok: true }> {
    await this.feedbackService.createReviewFeedback(
      req.user.sub,
      req.user.email,
      body,
    );
    return { ok: true };
  }
}
