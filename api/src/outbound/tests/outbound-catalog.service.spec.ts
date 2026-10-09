import { describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OutboundCatalogService } from '../catalog/outbound-catalog.service.js';
import { MessageTemplateEntity } from '../entities/message-template.entity.js';

describe('OutboundCatalogService', () => {
  it('returns segments and templates', async () => {
    const templatesRepo = {
      find: jest.fn(() =>
        Promise.resolve([
          {
            key: 'weekly_recap',
            category: 'transactional',
            channel: 'push',
            variables: ['sessionCount'],
            isActive: true,
            version: 1,
            updatedAt: new Date('2026-01-01'),
            content: { push: { title: 'T', body: 'B', route: '/' } },
          },
        ]),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        OutboundCatalogService,
        {
          provide: getRepositoryToken(MessageTemplateEntity),
          useValue: templatesRepo,
        },
      ],
    }).compile();

    const service = module.get(OutboundCatalogService);
    const catalog = await service.getCatalog();

    expect(catalog.segments.length).toBeGreaterThanOrEqual(7);
    expect(catalog.segments.some((s) => s.key === 'inactive_since')).toBe(true);
    expect(catalog.segments.some((s) => s.key === 'active_with_email')).toBe(
      true,
    );
    expect(
      catalog.segments.some((s) => s.key === 'registered_no_exercise'),
    ).toBe(true);
    expect(catalog.segments.some((s) => s.key === 'registered_no_push')).toBe(
      true,
    );
    expect(catalog.segments.some((s) => s.key === 'lapsed_after_session')).toBe(
      true,
    );
    expect(catalog.templates).toHaveLength(1);
    expect(catalog.endpoints.catalog.path).toBe('/internal/outbound/catalog');
  });
});
