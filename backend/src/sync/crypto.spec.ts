import { randomBytes } from 'crypto';
import { decryptCredential, encryptCredential } from './crypto';

describe('crypto', () => {
  const key = randomBytes(32).toString('base64');

  it('расшифровывает то, что было зашифровано', () => {
    const secret = 'app-password-Яндекс-123';
    const encrypted = encryptCredential(secret, key);
    expect(decryptCredential(encrypted, key)).toBe(secret);
  });

  it('каждое шифрование даёт уникальный ciphertext (случайный IV)', () => {
    const secret = 'same-secret';
    const first = encryptCredential(secret, key);
    const second = encryptCredential(secret, key);
    expect(first).not.toBe(second);
    expect(Buffer.from(first, 'base64').length).toBeGreaterThan(12 + 16);
  });

  it('не расшифровывается другим ключом', () => {
    const encrypted = encryptCredential('secret', key);
    const otherKey = randomBytes(32).toString('base64');
    expect(() => decryptCredential(encrypted, otherKey)).toThrow();
  });

  it('бросает ошибку при ключе неверной длины', () => {
    const shortKey = randomBytes(16).toString('base64');
    expect(() => encryptCredential('secret', shortKey)).toThrow(
      'Key must be 32 bytes',
    );
    expect(() => decryptCredential('payload', shortKey)).toThrow(
      'Key must be 32 bytes',
    );
  });
});
