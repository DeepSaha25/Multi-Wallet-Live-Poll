import {
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";
import { walletKit, getNetworkPassphrase } from "./wallet";
import { mapWalletError } from "./errors";

const rpcUrl =
  import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const contractId = import.meta.env.VITE_CONTRACT_ID || "";

export const server = new rpc.Server(rpcUrl);

export function getContractId(): string {
  return contractId;
}

export function getRpcUrl(): string {
  return rpcUrl;
}

export async function getWalletAddress(): Promise<string> {
  const { address } = await walletKit.getAddress();
  if (!address) {
    throw new Error("wallet not found");
  }
  return address;
}

export async function invokeVote(option: "yes" | "no"): Promise<string> {
  if (!contractId) {
    throw new Error("Missing VITE_CONTRACT_ID env value.");
  }

  try {
    const userAddress = await getWalletAddress();
    const source = await server.getAccount(userAddress);
    const contract = new Contract(contractId);
    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: getNetworkPassphrase() || Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          "vote",
          nativeToScVal(userAddress, { type: "address" }),
          nativeToScVal(option, { type: "symbol" })
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(simulated)) {
      throw new Error(simulated.error || "Simulation failed");
    }

    const assembled = rpc.assembleTransaction(tx, simulated).build();
    const signed = await walletKit.signTransaction(assembled.toXDR(), {
      networkPassphrase: getNetworkPassphrase() || Networks.TESTNET,
    });

    const sendResponse = await server.sendTransaction(
      TransactionBuilder.fromXDR(
        signed.signedTxXdr,
        getNetworkPassphrase() || Networks.TESTNET
      )
    );

    if (sendResponse.status === "ERROR") {
      const message = sendResponse.errorResult?.toXDR("base64") || "Transaction failed to submit.";
      throw new Error(message);
    }

    return sendResponse.hash;
  } catch (error) {
    throw new Error(mapWalletError(error));
  }
}

export async function waitForTransaction(hash: string): Promise<"SUCCESS" | "FAILED"> {
  for (let i = 0; i < 30; i += 1) {
    const tx = await server.getTransaction(hash);

    if (tx.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return "SUCCESS";
    }

    if (tx.status === rpc.Api.GetTransactionStatus.FAILED) {
      return "FAILED";
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return "FAILED";
}

export async function readResults(): Promise<{ yes: number; no: number }> {
  if (!contractId) {
    return { yes: 0, no: 0 };
  }

  const random = await server.getAccount(
    "GBRPYHIL2C3ANQFQKWC5QIQEEW2S7J65A2Y4J6XGL6KQ3N5HTKSTOMFY"
  );

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(random, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase() || Networks.TESTNET,
  })
    .addOperation(contract.call("get_results"))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simulated) || !simulated.result?.retval) {
    return { yes: 0, no: 0 };
  }

  const tuple = simulated.result.retval as xdr.ScVal;
  if (tuple.switch() !== xdr.ScValType.scvVec()) {
    return { yes: 0, no: 0 };
  }

  const values = tuple.vec() ?? [];
  const yes = Number(values[0]?.u32() || 0);
  const no = Number(values[1]?.u32() || 0);

  return { yes, no };
}

export async function getContractEvents(startLedger?: number): Promise<unknown[]> {
  if (!contractId) {
    return [];
  }

  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "getEvents",
    params: {
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [contractId],
          topics: [["*"], ["*"]],
        },
      ],
      pagination: { limit: 20 },
    },
  };

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  return json?.result?.events ?? [];
}
