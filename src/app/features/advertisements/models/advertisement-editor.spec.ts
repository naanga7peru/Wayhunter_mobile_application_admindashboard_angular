import { AdvertisementEditorFields, validateAdvertisementEditor } from './advertisement-editor';

const valid: AdvertisementEditorFields = {
  title: '  Sample advertisement  ',
  imageUrl: 'https://images.example.com/ad.webp',
  destinationUrl: '',
  startAtUtc: '2026-12-01T09:30:00Z',
  endAtUtc: '2026-12-02T09:30:00+00:00',
  placement: 'HomeBanner',
};

describe('ADM-05 advertisement editor validation', () => {
  it('accepts create without a destination', () => {
    expect(validateAdvertisementEditor(valid)).toEqual({});
  });

  it('accepts edit at the title and URL length limits', () => {
    const prefix = 'https://example.com/';
    expect(validateAdvertisementEditor({
      ...valid, title: ' ' + 'x'.repeat(200) + ' ', placement: 'SponsoredPoi',
      destinationUrl: prefix + 'x'.repeat(2048 - prefix.length),
    })).toEqual({});
  });

  it.each(['', ' \t ', 'x'.repeat(201)])('rejects an invalid title', title => {
    expect(validateAdvertisementEditor({ ...valid, title })).toHaveProperty('title');
  });

  it('requires the image URL', () => {
    expect(validateAdvertisementEditor({ ...valid, imageUrl: '' })).toHaveProperty('imageUrl');
  });

  it.each([
    ' ', 'http://example.com/ad', 'https:example.com', 'https://localhost/ad',
    'https://127.0.0.1/ad', 'https://[::1]/ad', 'https://192.0.2.1/ad',
    'https://a.localhost/ad', 'https://a.local/ad', 'https://a.internal/ad',
    'https://example.com./ad', 'https://a..example.com/ad', 'https://example.com:8443/ad',
    'https://user:pass@example.com/ad', ' https://example.com/ad', 'https://example.com/ad ',
    'https://example.com/a\\d', 'https://example.com/a\td', 'https://example.com/' + 'x'.repeat(2030),
  ])('rejects an invalid URL in either field (%#)', url => {
    expect(validateAdvertisementEditor({ ...valid, imageUrl: url, destinationUrl: url }))
      .toMatchObject({ imageUrl: expect.any(String), destinationUrl: expect.any(String) });
  });

  it.each([
    '', '2026-12-01', '2026-12-01T09:30:00', '2026-12-01T09:30:00+05:30',
    '2026-02-30T09:30:00Z', '2026-12-01T24:00:00Z', '0001-01-01T00:00:00Z',
  ])('rejects invalid UTC input %j for either date', date => {
    expect(validateAdvertisementEditor({ ...valid, startAtUtc: date, endAtUtc: date }))
      .toMatchObject({ startAtUtc: expect.any(String), endAtUtc: expect.any(String) });
  });

  it.each(['2026-11-30T09:30:00Z', '2026-12-01T09:30:00+00:00'])('rejects end at or before start', endAtUtc => {
    expect(validateAdvertisementEditor({ ...valid, endAtUtc })).toEqual({ endAtUtc: 'End must be after start.' });
  });

  it('orders UTC timestamps at the Backend tick precision', () => {
    expect(validateAdvertisementEditor({
      ...valid, startAtUtc: '2026-12-01T09:30:00.0000001Z', endAtUtc: '2026-12-01T09:30:00.0000002Z',
    })).toEqual({});
  });

  it.each(['', 'Traveler', '0'])('rejects unsupported placement %j', placement => {
    expect(validateAdvertisementEditor({ ...valid, placement })).toHaveProperty('placement');
  });
});
