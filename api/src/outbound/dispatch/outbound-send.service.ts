import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';
import { UserProfileEntity } from '../../profile/user-profile.entity.js';
import { ConsentService } from '../consent/consent.service.js';
import { OutboundMessageEntity } from '../entities/outbound-message.entity.js';
import { TemplateService } from '../templates/template.service.js';
import { TemplateRendererService } from '../templates/template-renderer.service.js';

@Injectable()
export class OutboundSendService {
  constructor(
    @InjectRepository(OutboundMessageEntity)
    private readonly messagesRepo: Repository<OutboundMessageEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    private readonly templates: TemplateService,
    private readonly renderer: TemplateRendererService,
    private readonly consent: ConsentService,
  ) {}

  private buildDedupKey(idempotencyKey: string, userId: string): string {
    return `${idempotencyKey}:${userId}`;
  }

  async queueSend(params: {
    userId: string;
    templateKey: string;
    variables?: Record<string, string | number | boolean>;
    channel?: 'email' | 'push' | 'auto';
    idempotencyKey: string;
    dispatchId?: string | null;
  }): Promise<{ messageId: string; created: boolean; status: string }> {
    const template = await this.templates.getActiveByKey(params.templateKey);
    const channel = this.renderer.resolveChannel(
      template,
      params.channel ?? 'auto',
    );
    const dedupKey = this.buildDedupKey(params.idempotencyKey, params.userId);
    const variables = params.variables ?? {};

    if (template.category === 'marketing' && channel === 'email') {
      const allowed = await this.consent.isEmailMarketingAllowed(params.userId);
      if (!allowed) {
        try {
          const row = await this.messagesRepo.save(
            this.messagesRepo.create({
              dispatchId: params.dispatchId ?? null,
              userId: params.userId,
              templateKey: template.key,
              channel,
              category: template.category,
              dedupKey,
              status: 'suppressed',
              variables,
            }),
          );
          return { messageId: row.id, created: true, status: 'suppressed' };
        } catch (err) {
          if (err instanceof QueryFailedError) {
            const existing = await this.messagesRepo.findOne({
              where: { dedupKey },
            });
            if (existing) {
              return {
                messageId: existing.id,
                created: false,
                status: existing.status,
              };
            }
          }
          throw err;
        }
      }
    }

    try {
      const row = await this.messagesRepo.save(
        this.messagesRepo.create({
          dispatchId: params.dispatchId ?? null,
          userId: params.userId,
          templateKey: template.key,
          channel,
          category: template.category,
          dedupKey,
          status: 'pending',
          variables,
        }),
      );
      return { messageId: row.id, created: true, status: 'pending' };
    } catch (err) {
      if (err instanceof QueryFailedError) {
        const existing = await this.messagesRepo.findOne({
          where: { dedupKey },
        });
        if (existing) {
          return {
            messageId: existing.id,
            created: false,
            status: existing.status,
          };
        }
      }
      throw err;
    }
  }

  async resolveFirstName(userId: string): Promise<string> {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    const name = profile?.firstName?.trim();
    return name || 'athlète';
  }

  async resolveUserEmail(userId: string): Promise<string | null> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    return user?.email?.trim() ?? null;
  }
}
