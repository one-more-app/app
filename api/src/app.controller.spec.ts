import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('AppController', () => {
  describe('root', () => {
    it('should return "Hello World!"', () => {
      const appController = new AppController(
        new AppService(makeConfig({})),
      );
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return status ok without minVersion when env empty', () => {
      const appController = new AppController(
        new AppService(makeConfig({})),
      );
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });

    it('should include ios/android minVersion when set', () => {
      const appController = new AppController(
        new AppService(
          makeConfig({
            MIN_APP_VERSION_IOS: '1.4.0',
            MIN_APP_VERSION_ANDROID: '1.3.0',
          }),
        ),
      );
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        minVersion: { ios: '1.4.0', android: '1.3.0' },
      });
    });

    it('should omit blank platform entries', () => {
      const appController = new AppController(
        new AppService(
          makeConfig({
            MIN_APP_VERSION_IOS: '  ',
            MIN_APP_VERSION_ANDROID: '1.2.0',
          }),
        ),
      );
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        minVersion: { android: '1.2.0' },
      });
    });

    it('should ignore invalid semver env values', () => {
      const appController = new AppController(
        new AppService(
          makeConfig({
            MIN_APP_VERSION_IOS: 'latest',
            MIN_APP_VERSION_ANDROID: 'v1.4.0',
          }),
        ),
      );
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        minVersion: { android: '1.4.0' },
      });
    });
  });
});
