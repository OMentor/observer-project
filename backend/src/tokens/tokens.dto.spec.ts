import { batchTokenSchema, createTokenSchema } from './tokens.dto';

describe('tokens dto · expires_at', () => {
  it('null не превращается в 1970 год', () => {
    const parsed = createTokenSchema.parse({ preset: 'OWN', expires_at: null });
    expect(parsed.expires_at).toBeUndefined();
  });

  it('пустая строка нормализуется в отсутствие срока', () => {
    const parsed = createTokenSchema.parse({ preset: 'OWN', expires_at: '' });
    expect(parsed.expires_at).toBeUndefined();
  });

  it('валидная дата сохраняется', () => {
    const parsed = createTokenSchema.parse({
      preset: 'OWN',
      expires_at: '2030-01-01T00:00:00.000Z',
    });
    expect(parsed.expires_at).toBeInstanceOf(Date);
    expect(parsed.expires_at?.getUTCFullYear()).toBe(2030);
  });

  it('batch: null также нормализуется', () => {
    const parsed = batchTokenSchema.parse({
      space_id: '11111111-1111-4111-8111-111111111111',
      preset: 'FULL',
      count: 2,
      expires_at: null,
    });
    expect(parsed.expires_at).toBeUndefined();
  });
});
