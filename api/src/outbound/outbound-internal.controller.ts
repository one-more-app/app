import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  OutboundDispatchDto,
  OutboundSendDto,
} from './dto/outbound-send.dto.js';
import { OutboundCatalogService } from './catalog/outbound-catalog.service.js';
import { OutboundDispatchService } from './dispatch/outbound-dispatch.service.js';
import { OutboundSendService } from './dispatch/outbound-send.service.js';
import { OutboundApiKeyGuard } from './guards/outbound-api-key.guard.js';

@Controller('internal/outbound')
@UseGuards(OutboundApiKeyGuard)
export class OutboundInternalController {
  constructor(
    private readonly send: OutboundSendService,
    private readonly dispatch: OutboundDispatchService,
    private readonly catalog: OutboundCatalogService,
  ) {}

  @Get('catalog')
  getCatalog() {
    return this.catalog.getCatalog();
  }

  @Post('send')
  @HttpCode(202)
  async sendOne(@Body() body: OutboundSendDto) {
    const result = await this.send.queueSend({
      userId: body.userId,
      templateKey: body.templateKey,
      variables: body.variables,
      channel: body.channel,
      idempotencyKey: body.idempotencyKey,
    });
    return {
      messageId: result.messageId,
      status: result.status,
      created: result.created,
    };
  }

  @Post('dispatch')
  @HttpCode(202)
  async dispatchBatch(@Body() body: OutboundDispatchDto) {
    const result = await this.dispatch.createDispatch({
      segmentKey: body.segmentKey,
      params: body.params,
      templateKey: body.templateKey,
      channel: body.channel,
      campaignKey: body.campaignKey,
      idempotencyKey: body.idempotencyKey,
      confirmLargeAudience: body.confirmLargeAudience,
    });
    return result;
  }

  @Get('dispatch/:id')
  async getDispatch(@Param('id') id: string) {
    const row = await this.dispatch.getDispatch(id);
    if (!row) throw new NotFoundException();
    return {
      id: row.id,
      status: row.status,
      segmentKey: row.segmentKey,
      templateKey: row.templateKey,
      recipientCount: row.recipientCount,
      queuedCount: row.queuedCount,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
