import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { RedditConversionsService } from '../reddit-conversions.service.js';

describe('RedditConversionsService', () => {
  const fetchMock = jest.fn<typeof fetch>();
  const configValues: Record<string, string | undefined> = {};
  const config = {
    get: (key: string) => configValues[key],
  } as unknown as ConfigService;

  let service: RedditConversionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(configValues)) delete configValues[key];
    configValues.REDDIT_PIXEL_ID = 'a2_jo1mdxsidf2o';
    configValues.REDDIT_CONVERSIONS_ACCESS_TOKEN = 'reddit-token';
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: { message: 'Successfully processed 1 conversion events.' },
        }),
    } as Response);
    service = new RedditConversionsService(config, fetchMock);
  });

  it('does not call Reddit when the access token is missing', async () => {
    configValues.REDDIT_CONVERSIONS_ACCESS_TOKEN = '';
    await service.scheduleSignUp({
      isNewUser: true,
      userId: 'user-1',
      email: 'a@b.com',
      actionSource: 'APP',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not call Reddit for existing users (login / oauth link)', async () => {
    await service.scheduleSignUp({
      isNewUser: false,
      userId: 'user-1',
      email: 'a@b.com',
      actionSource: 'APP',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POSTs SIGN_UP to CAPI v3 with bearer token', async () => {
    await service.scheduleSignUp({
      isNewUser: true,
      userId: 'user-42',
      email: 'alice@example.com',
      ipAddress: '203.0.113.10',
      userAgent: 'OneMore/1.0',
      actionSource: 'APP',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(
      'https://ads-api.reddit.com/api/v3/pixels/a2_jo1mdxsidf2o/conversion_events',
    );
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer reddit-token',
      'Content-Type': 'application/json',
    });
    const body = JSON.parse(String(init?.body));
    expect(body.data.events[0].type.tracking_type).toBe('SIGN_UP');
    expect(body.data.events[0].metadata.conversion_id).toBe('signup:user-42');
    expect(body.data.test_id).toBeUndefined();
  });

  it('does not throw when Reddit returns an error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'bad request',
    } as Response);

    await expect(
      service.scheduleSignUp({
        isNewUser: true,
        userId: 'user-1',
        email: 'a@b.com',
        actionSource: 'APP',
      }),
    ).resolves.toBeUndefined();
  });

  it('attaches test_id from env so Events Manager tests are not billed as ads conversions', async () => {
    configValues.REDDIT_CONVERSIONS_TEST_ID = 'events-manager-test';
    await service.scheduleSignUp({
      isNewUser: true,
      userId: 'user-1',
      email: 'a@b.com',
      actionSource: 'APP',
    });
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.data.test_id).toBe('events-manager-test');
  });
});
