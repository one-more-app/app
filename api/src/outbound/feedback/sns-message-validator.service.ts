import { Injectable, UnauthorizedException } from '@nestjs/common';
import MessageValidator from 'sns-validator';

@Injectable()
export class SnsMessageValidatorService {
  private readonly validator = new MessageValidator();

  async validate(body: string): Promise<Record<string, unknown>> {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(body) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Corps SNS invalide');
    }

    await new Promise<void>((resolve, reject) => {
      this.validator.validate(parsed, (err) => {
        if (err) reject(new UnauthorizedException('Signature SNS invalide'));
        else resolve();
      });
    });

    return parsed;
  }
}
