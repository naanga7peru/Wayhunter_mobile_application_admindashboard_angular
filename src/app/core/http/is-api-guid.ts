const GUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

export function isApiGuid(value: string): boolean {
  return typeof value === 'string' && value.length === 36 && GUID.test(value) && value !== EMPTY_GUID;
}
