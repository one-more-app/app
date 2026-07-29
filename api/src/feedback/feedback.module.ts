import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';

@Module({
  imports: [ProfileModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
