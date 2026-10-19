import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalProvider } from '@prisma/client';
import { decryptCredential } from '../crypto';
import { CaldavProvider } from './caldav.provider';
import { SyncProvider } from './sync-provider.interface';

/** Сохранённое подключение (как хранится в БД). */
export interface StoredConnection {
  provider: ExternalProvider;
  caldav_url: string;
  caldav_username: string;
  caldav_password_enc: string;
}

/** Провайдеры, реализованные в MVP Этапа 6 (Apple отложен до Этапа 7). */
const SUPPORTED_PROVIDERS: ExternalProvider[] = ['yandex', 'mailru'];

@Injectable()
export class ProviderFactory {
  constructor(private readonly config: ConfigService) {}

  /** Создаёт провайдер из сохранённого подключения (пароль расшифровывается). */
  create(connection: StoredConnection): SyncProvider {
    const password = decryptCredential(
      connection.caldav_password_enc,
      this.config.get<string>('ENCRYPTION_KEY'),
    );
    return this.build(
      connection.provider,
      connection.caldav_url,
      connection.caldav_username,
      password,
    );
  }

  /** Создаёт провайдер для проверки ещё не сохранённых реквизитов. */
  createWithCredentials(
    provider: ExternalProvider,
    url: string,
    username: string,
    password: string,
  ): SyncProvider {
    return this.build(provider, url, username, password);
  }

  private build(
    provider: ExternalProvider,
    url: string,
    username: string,
    password: string,
  ): SyncProvider {
    if (provider === 'apple') {
      throw new BadRequestException('Apple is deferred to Stage 7');
    }
    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
    return new CaldavProvider({ url, username, password }, provider);
  }
}
