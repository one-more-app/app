import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type HealthMinVersion = {
  ios?: string;
  android?: string;
};

export type HealthResponse = {
  status: 'ok';
  minVersion?: HealthMinVersion;
};

function normalizeMinVersion(raw: string | undefined): string | undefined {
  const trimmed = (raw ?? '').trim().replace(/^[vV]/, '');
  if (!/^\d+\.\d+\.\d+$/.test(trimmed)) return undefined;
  return trimmed;
}

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): HealthResponse {
    const ios = normalizeMinVersion(
      this.config.get<string>('MIN_APP_VERSION_IOS'),
    );
    const android = normalizeMinVersion(
      this.config.get<string>('MIN_APP_VERSION_ANDROID'),
    );
    const minVersion: HealthMinVersion = {};
    if (ios) minVersion.ios = ios;
    if (android) minVersion.android = android;
    if (!minVersion.ios && !minVersion.android) {
      return { status: 'ok' };
    }
    return { status: 'ok', minVersion };
  }
}
