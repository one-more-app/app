import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplateEntity } from '../entities/message-template.entity.js';
import { SEGMENT_CATALOG } from '../segments/segment-catalog.js';

@Injectable()
export class OutboundCatalogService {
  constructor(
    @InjectRepository(MessageTemplateEntity)
    private readonly templatesRepo: Repository<MessageTemplateEntity>,
  ) {}

  async getCatalog() {
    const templates = await this.templatesRepo.find({
      order: { key: 'ASC' },
    });

    return {
      segments: SEGMENT_CATALOG,
      templates: templates.map((t) => ({
        key: t.key,
        category: t.category,
        channel: t.channel,
        variables: t.variables,
        isActive: t.isActive,
        version: t.version,
        updatedAt: t.updatedAt,
        content: t.content,
      })),
      endpoints: {
        send: {
          method: 'POST',
          path: '/internal/outbound/send',
          authHeader: 'X-Outbound-Api-Key',
        },
        dispatch: {
          method: 'POST',
          path: '/internal/outbound/dispatch',
          authHeader: 'X-Outbound-Api-Key',
        },
        dispatchStatus: {
          method: 'GET',
          path: '/internal/outbound/dispatch/:id',
          authHeader: 'X-Outbound-Api-Key',
        },
        catalog: {
          method: 'GET',
          path: '/internal/outbound/catalog',
          authHeader: 'X-Outbound-Api-Key',
        },
      },
    };
  }
}
