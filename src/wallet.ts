// import WalletConnectProvider from '@walletconnect/web3-provider'
import { ThreeIdConnect, EthereumAuthProvider } from '3id-connect'
// import Authereum from 'authereum'
import type { DIDProvider } from "dids"
import Web3Modal from "web3modal"
import Portis from "@portis/web3";

export const threeID = new ThreeIdConnect(process.env.REACT_APP_THREEID_API)

export const web3Modal = new Web3Modal({
  network: "mainnet",
  cacheProvider: true,
  providerOptions: {
    portis: {
      package: Portis,
      options: {
        id: "79aa26b1-16cd-4462-9dd9-49ace9c216e3"
      }
    },
  },
})

export async function getProvider(): Promise<DIDProvider> {
  const ethProvider = await web3Modal.connect()
  const addresses = await ethProvider.enable();
  const authProvider = new EthereumAuthProvider(ethProvider, addresses[0]);
  await threeID.connect(authProvider);
  return threeID.getDidProvider();
}
