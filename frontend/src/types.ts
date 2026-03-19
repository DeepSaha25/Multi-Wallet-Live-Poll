export type TxStatus = "idle" | "pending" | "success" | "fail";

export type WalletState = {
  address: string;
  walletId: string;
};

export type PollResult = {
  yes: number;
  no: number;
};

export type VoteEventItem = {
  id: string;
  ledger: number;
  txHash: string;
  option: string;
  rawValue: unknown;
};
