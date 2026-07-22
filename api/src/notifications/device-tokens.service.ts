import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RegisterDeviceDto } from './dto/register-device.dto.js';
import { DeviceTokenEntity } from './entities/device-token.entity.js';

@Injectable()
export class DeviceTokensService {
  constructor(
    @InjectRepository(DeviceTokenEntity)
    private readonly repo: Repository<DeviceTokenEntity>,
  ) {}

  async register(userId: string, dto: RegisterDeviceDto) {
    const now = new Date();
    await this.repo.upsert(
      {
        userId,
        token: dto.token,
        platform: dto.platform,
        timezone: dto.timezone,
        lastSeenAt: now,
      },
      ['token'],
    );
    return { ok: true };
  }

  async remove(userId: string, token: string) {
    await this.repo.delete({ userId, token });
    return { ok: true };
  }

  async removeInvalidToken(token: string) {
    await this.repo.delete({ token });
  }

  async listForUser(userId: string) {
    return await this.repo.find({ where: { userId } });
  }

  async getTimezoneForUser(userId: string): Promise<string> {
    const row = await this.repo.findOne({
      where: { userId },
      order: { lastSeenAt: 'DESC' },
      select: ['timezone'],
    });
    return row?.timezone ?? 'UTC';
  }

  async listDistinctTimezones(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('d')
      .select('DISTINCT d.timezone', 'timezone')
      .getRawMany<{ timezone: string }>();
    return rows.map((r) => r.timezone).filter(Boolean);
  }

  async listUserIdsByTimezone(timezone: string): Promise<string[]> {
    const rows = await this.repo.find({
      where: { timezone },
      select: ['userId'],
    });
    return [...new Set(rows.map((r) => r.userId))];
  }
}
