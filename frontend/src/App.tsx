import { useEffect, useMemo, useState } from "react";
import { mapWalletError } from "./lib/errors";
import {
  getContractEvents,
  getContractId,
  getRpcUrl,
  getWalletAddress,
  invokeVote,
  readResults,
  waitForTransaction,
} from "./lib/soroban";
import { openWalletModal } from "./lib/wallet";
import { TxStatus, VoteEventItem } from "./types";

function App() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [yesVotes, setYesVotes] = useState<number>(0);
  const [noVotes, setNoVotes] = useState<number>(0);
  const [events, setEvents] = useState<VoteEventItem[]>([]);
  const [lastLedger, setLastLedger] = useState<number | undefined>(undefined);

  const totalVotes = useMemo(() => yesVotes + noVotes, [yesVotes, noVotes]);

  async function refreshResults() {
    try {
      const { yes, no } = await readResults();
      setYesVotes(yes);
      setNoVotes(no);
    } catch {
      // UI should stay responsive even if read call fails momentarily.
    }
  }

  async function connectWallet() {
    setErrorMessage("");
    try {
      await openWalletModal();
      const address = await getWalletAddress();
      setWalletAddress(address);
    } catch (error) {
      setErrorMessage(mapWalletError(error));
    }
  }

  async function submitVote(option: "yes" | "no") {
    setErrorMessage("");
    setTxStatus("pending");

    try {
      const hash = await invokeVote(option);
      setTxHash(hash);

      const finalStatus = await waitForTransaction(hash);
      if (finalStatus === "SUCCESS") {
        setTxStatus("success");
        await refreshResults();
      } else {
        setTxStatus("fail");
        setErrorMessage("Transaction failed on-chain.");
      }
    } catch (error) {
      setTxStatus("fail");
      setErrorMessage(mapWalletError(error));
    }
  }

  useEffect(() => {
    refreshResults();

    const interval = setInterval(async () => {
      const eventItems = (await getContractEvents(lastLedger)) as Array<{
        id?: string;
        ledger?: number;
        txHash?: string;
        value?: unknown;
      }>;

      if (eventItems.length === 0) {
        return;
      }

      const normalized = eventItems.map((item) => ({
        id: item.id || crypto.randomUUID(),
        ledger: Number(item.ledger || 0),
        txHash: item.txHash || "",
        option: "vote",
        rawValue: item.value,
      }));

      const newestLedger = Math.max(...normalized.map((item) => item.ledger));
      setLastLedger(newestLedger);
      setEvents((prev) => [...normalized, ...prev].slice(0, 20));
      await refreshResults();
    }, 5000);

    return () => clearInterval(interval);
  }, [lastLedger]);

  return (
    <div className="app-shell">
      <div className="orb orb-left" />
      <div className="orb orb-right" />

      <main className="card">
        <header>
          <p className="eyebrow">Stellar Level 2</p>
          <h1>Live Poll Contract</h1>
          <p className="subtext">
            Multi-wallet voting with Soroban contract writes, reads, and real-time event sync.
          </p>
        </header>

        <section className="meta-grid">
          <div className="meta-item">
            <span>RPC</span>
            <strong>{getRpcUrl()}</strong>
          </div>
          <div className="meta-item">
            <span>Contract ID</span>
            <strong>{getContractId() || "Missing in .env"}</strong>
          </div>
          <div className="meta-item">
            <span>Wallet</span>
            <strong>{walletAddress || "Not connected"}</strong>
          </div>
        </section>

        <section className="actions">
          <button onClick={connectWallet}>Connect Wallet</button>
          <button onClick={() => submitVote("yes")} disabled={!walletAddress || txStatus === "pending"}>
            Vote YES
          </button>
          <button onClick={() => submitVote("no")} disabled={!walletAddress || txStatus === "pending"}>
            Vote NO
          </button>
        </section>

        <section className="status-panel">
          <h2>Transaction Status</h2>
          <p className={`status status-${txStatus}`}>{txStatus.toUpperCase()}</p>
          {txHash && (
            <p>
              Hash: <span className="mono">{txHash}</span>
            </p>
          )}
          {errorMessage && <p className="error">{errorMessage}</p>}
        </section>

        <section className="results">
          <h2>Poll Results</h2>
          <div className="bars">
            <div>
              <label>YES ({yesVotes})</label>
              <progress value={yesVotes} max={Math.max(totalVotes, 1)} />
            </div>
            <div>
              <label>NO ({noVotes})</label>
              <progress value={noVotes} max={Math.max(totalVotes, 1)} />
            </div>
          </div>
        </section>

        <section className="events">
          <h2>Recent Contract Events</h2>
          {events.length === 0 ? (
            <p className="subtext">No events yet.</p>
          ) : (
            <ul>
              {events.map((event) => (
                <li key={event.id}>
                  <strong>Ledger {event.ledger}</strong>
                  <span className="mono">{event.txHash || "n/a"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
