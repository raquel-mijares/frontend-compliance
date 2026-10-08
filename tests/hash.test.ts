import { describe, it, expect } from 'vitest';
import {
  hashUserData,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  sha256,
} from '../src/hash';

describe('hashing user data', () => {
  it('produces the standard SHA-256 hex digest', async () => {
    expect(await sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('trims and lowercases emails', () => {
    expect(normalizeEmail('  Ana@Example.COM ')).toBe('ana@example.com');
  });

  it('reduces phones to digits with the country code once', () => {
    expect(normalizePhone('(403) 555-0142')).toBe('14035550142');
    expect(normalizePhone('+1 403 555 0142')).toBe('14035550142');
    expect(normalizePhone('---')).toBe('');
  });

  it('lowercases names and strips accents', () => {
    expect(normalizeName('  José ')).toBe('jose');
    expect(normalizeName('ZOË')).toBe('zoe');
  });

  it('hashes each field under the key the conversion API expects', async () => {
    const out = await hashUserData({
      email: 'Ana@Example.com',
      phone: '403 555 0142',
      firstName: 'Ana',
      lastName: 'Pérez',
    });

    expect(out).toEqual({
      em: await sha256('ana@example.com'),
      ph: await sha256('14035550142'),
      fn: await sha256('ana'),
      ln: await sha256('perez'),
    });
  });

  it('leaves out fields that were not provided', async () => {
    expect(Object.keys(await hashUserData({ email: 'ana@example.com' }))).toEqual(['em']);
    expect(await hashUserData({})).toEqual({});
  });
});
