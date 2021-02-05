import type { CeramicApi } from '@ceramicnetwork/common'
import Ceramic from '@ceramicnetwork/http-client'

declare global {
  interface Window {
    ceramic?: CeramicApi
  }
}
const url = "https://ceramic-clay.3boxlabs.com";
// const url = "http://localhost:7007";

export async function createCeramic(): Promise<CeramicApi> {
  const ceramic = new Ceramic(url);
  window.ceramic = ceramic
  return Promise.resolve(ceramic as CeramicApi)
}
