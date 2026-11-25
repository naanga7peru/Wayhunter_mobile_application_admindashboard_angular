export const editorPlacements = ['HomeBanner', 'SponsoredPoi'] as const;
export type EditorPlacement = typeof editorPlacements[number];

export interface AdvertisementEditorFields {
  readonly title: string;
  readonly imageUrl: string;
  readonly destinationUrl: string;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly placement: string;
}

export type AdvertisementEditorField = keyof AdvertisementEditorFields;
export type AdvertisementEditorErrors = Partial<Record<AdvertisementEditorField, string>>;

const maxUrlLength = 2048;
// Match .NET whitespace for title trimming and URL boundary checks.
const trimWhitespace = (value: string) => value.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, '');

export function isAdvertisementHttpsUrl(value: string): boolean {
  if (value.length > maxUrlLength || value !== trimWhitespace(value) || /[\p{Cc}\\]/u.test(value)) {
    return false;
  }

  // Require an explicit authority. URL alone also accepts inputs such as https:example.com.
  const authority = /^https:\/\/@?([^@%:/?#]+)(?::(\d*))?(?=[/?#]|$)/i.exec(value);
  if (!authority) return false;
  const [, rawHost, port] = authority;
  if (port && Number(port) !== 443) return false;

  // Browser URL parsing treats a numeric final label as an IPv4 candidate.
  // If it cannot parse an IP, decode the name via IDNA without that heuristic.
  const browserHost = URL.parse('https://' + rawHost)?.hostname;
  if (browserHost && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(browserHost)) return false;
  const host = browserHost ??
    URL.parse('https://' + rawHost + '.example')?.hostname.slice(0, -'.example'.length);
  if (!host) return false;
  return host.includes('.') &&
    !/\.(localhost|local|internal)$/i.test(host) &&
    host.split('.').every(label => /^[a-z\d][a-z\d_-]{0,62}$/i.test(label));
}

function utcSortKey(value: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2})(?:\.(\d{1,16}))?)?(?:Z|[+-]00:00)$/.exec(value);
  if (!match || match[0] !== value) return null;
  const [, date, time, second = '00', fraction = ''] = match;
  const whole = `${date}T${time}:${second}`;
  const parsed = new Date(whole + 'Z');
  // The round trip rejects calendar rollover and the .NET year range starts at 0001.
  if (date.startsWith('0000') || !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 19) !== whole) return null;
  const ticks = fraction.padEnd(7, '0').slice(0, 7);
  return whole === '0001-01-01T00:00:00' && ticks === '0000000' ? null : whole + '.' + ticks;
}

export function validateAdvertisementEditor(fields: AdvertisementEditorFields): AdvertisementEditorErrors {
  const errors: AdvertisementEditorErrors = {};
  const title = trimWhitespace(fields.title);
  const start = utcSortKey(fields.startAtUtc);
  const end = utcSortKey(fields.endAtUtc);

  if (!title || title.length > 200) errors.title = 'Enter a title with 1 to 200 characters after trimming.';
  if (!isAdvertisementHttpsUrl(fields.imageUrl)) {
    errors.imageUrl = 'Enter an HTTPS image URL with a DNS hostname and default port, up to 2,048 characters.';
  }
  if (fields.destinationUrl !== '' && !isAdvertisementHttpsUrl(fields.destinationUrl)) {
    errors.destinationUrl = 'Enter an HTTPS destination URL with a DNS hostname and default port, up to 2,048 characters, or leave it blank.';
  }
  if (start === null) errors.startAtUtc = 'Enter a valid start date and time in UTC.';
  if (end === null) errors.endAtUtc = 'Enter a valid end date and time in UTC.';
  if (start !== null && end !== null && end <= start) errors.endAtUtc = 'End must be after start.';
  if (!editorPlacements.some(placement => placement === fields.placement)) {
    errors.placement = 'Choose Home banner or Sponsored POI.';
  }
  return errors;
}

export function advertisementPreviewFields(fields: AdvertisementEditorFields): AdvertisementEditorFields {
  return { ...fields, title: trimWhitespace(fields.title) };
}
