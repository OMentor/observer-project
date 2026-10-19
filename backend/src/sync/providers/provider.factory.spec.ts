import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { encryptCredential } from '../crypto';
import { CaldavProvider } from './caldav.provider';
import { ProviderFactory } from './provider.factory';

const ENCRYPTION_KEY = randomBytes(32).toString('base64');

describe('ProviderFactory', () => {
  const config = { get: jest.fn().mockReturnValue(ENCRYPTION_KEY) };
  const factory = new ProviderFactory(config as never);

  it('createWithCredentials для yandex создаёт CaldavProvider', () => {
    const provider = factory.createWithCredentials(
      'yandex',
      'http://localhost:5232',
      'dev',
      'secret',
    );
    expect(provider).toBeInstanceOf(CaldavProvider);
    expect(provider.provider).toBe('yandex');
  });

  it('apple откладывается до Этапа 7', () => {
    expect(() =>
      factory.createWithCredentials('apple', 'http://x', 'u', 'p'),
    ).toThrow(BadRequestException);
    expect(() =>
      factory.createWithCredentials('apple', 'http://x', 'u', 'p'),
    ).toThrow('Apple is deferred to Stage 7');
  });

  it('create расшифровывает пароль сохранённого подключения', () => {
    const passwordEnc = encryptCredential('secret-pass', ENCRYPTION_KEY);
    const provider = factory.create({
      provider: 'mailru',
      caldav_url: 'http://localhost:5232',
      caldav_username: 'dev',
      caldav_password_enc: passwordEnc,
    });
    expect(provider).toBeInstanceOf(CaldavProvider);
    expect(provider.provider).toBe('mailru');
  });
});
