import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplateEntity } from '../entities/message-template.entity.js';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(MessageTemplateEntity)
    private readonly repo: Repository<MessageTemplateEntity>,
  ) {}

  async getActiveByKey(key: string): Promise<MessageTemplateEntity> {
    const row = await this.repo.findOne({ where: { key, isActive: true } });
    if (!row) {
      throw new NotFoundException(`Template inconnu: ${key}`);
    }
    return row;
  }
}
