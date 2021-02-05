import type { DID } from 'dids'

import { createCeramic } from './ceramic'
import { createIDX } from './idx'
import { getProvider } from './wallet'

declare global {
  interface Window {
    did?: DID
  }
}

const ceramicPromise = createCeramic();

export const authenticate = async (): Promise<string> => {
  const [ceramic, provider] = await Promise.all([ceramicPromise, getProvider()])
  try {
    await ceramic.setDIDProvider(provider)
  } catch (error) {
    console.log("ER", error);
  }
  const idx = createIDX(ceramic)
  window.did = ceramic.did
  return idx.id
}
