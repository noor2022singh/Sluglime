import { headers } from 'next/headers';

export function getServerBaseUrl() {
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') || 'http';

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  return `${proto}://${host}`;
}
