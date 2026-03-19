import {
  WalletNetwork,
  allowAllModules,
  StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit";

const networkPassphrase =
  import.meta.env.VITE_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

export const walletKit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  modules: allowAllModules(),
  selectedWalletId: undefined,
});

export async function openWalletModal(): Promise<void> {
  await walletKit.openModal({
    onWalletSelected: async (option) => {
      walletKit.setWallet(option.id);
    },
  });
}

export function getNetworkPassphrase(): string {
  return networkPassphrase;
}
