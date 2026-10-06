import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConsentService } from './consent.service.js';
import {
  renderUnsubscribeDonePage,
  renderUnsubscribePage,
} from './unsubscribe-page.js';

const PREFERENCES_DEEP_LINK = 'https://one-more.app/#/settings';

@Controller('u')
export class UnsubscribeController {
  constructor(private readonly consent: ConsentService) {}

  @Get(':token')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async showUnsubscribe(@Param('token') token: string, @Res() res: Response) {
    const user = await this.consent.findUserByUnsubscribeToken(token);
    if (!user) {
      throw new NotFoundException();
    }

    const prefs = await this.consent.isEmailMarketingAllowed(user.id);
    const html = renderUnsubscribePage({
      token,
      alreadyUnsubscribed: !prefs,
      preferencesUrl: PREFERENCES_DEEP_LINK,
    });
    res.status(200).send(html);
  }

  @Post(':token')
  async confirmUnsubscribe(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const user = await this.consent.unsubscribeByToken(token);
    if (!user) {
      throw new NotFoundException();
    }

    const accept = res.req.headers.accept ?? '';
    if (accept.includes('text/html')) {
      res
        .status(200)
        .type('html')
        .send(renderUnsubscribeDonePage(PREFERENCES_DEEP_LINK));
      return;
    }

    res.status(200).send();
  }
}
