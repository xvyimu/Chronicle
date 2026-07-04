import { headers } from 'next/headers';

export async function getCspNonce(): Promise<string | undefined> {
  const nonce = (await headers()).get('x-nonce');
  return nonce ?? undefined;
}
