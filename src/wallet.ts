import WalletConnectProvider from '@walletconnect/web3-provider'
import { ThreeIdConnect, EthereumAuthProvider } from '3id-connect'
import Authereum from 'authereum'
import type { DIDProvider } from 'dids'
import Fortmatic from 'fortmatic'
import Web3Modal from 'web3modal'

export const threeID = new ThreeIdConnect(process.env.REACT_APP_THREEID_API)

export const web3Modal = new Web3Modal({
  network: 'mainnet',
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: 'e87f83fb85bf4aa09bdf6605ebe144b7',
      },
    },
    fortmatic: {
      package: Fortmatic,
      options: {
        key: 'pk_live_EC842EEAC7F08995',
      },
    },
    authereum: {
      package: Authereum,
      options: {},
    },
  },
})

export async function getProvider(): Promise<DIDProvider> {
  const ethProvider = await web3Modal.connect()
  const addresses = await ethProvider.enable();
  console.log("addresses", addresses);
  const authProvider = new EthereumAuthProvider(ethProvider, addresses[0]);
  const result = await threeID.connect(authProvider);
  console.log("connected to 3id", result);
  return threeID.getDidProvider();
}
