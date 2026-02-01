import { useMemo, useState } from "react";
import { Sparkles, Wallet } from "lucide-react";
import { BrowserProvider } from "ethers";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Props = {
  onConnected?: (address: string) => void;
};

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function WalletConnectLogin({ onConnected }: Props) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">(
    "idle",
  );
  const [address, setAddress] = useState<string | null>(null);

  const canConnect = useMemo(
    () => typeof window !== "undefined" && (window as any).ethereum,
    [],
  );

  async function connect() {
    if (!canConnect) return;

    setStatus("connecting");

    try {
      const eth = (window as any).ethereum;
      await eth.request({ method: "eth_requestAccounts" });

      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      setAddress(addr);
      setStatus("connected");
      onConnected?.(addr);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <Card className="glass shadow-soft rounded-2xl p-4 neon-accent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl border bg-card/70 shadow-soft neon-ring"
              data-testid="badge-wallet"
            >
              <Wallet className="h-4 w-4 text-[hsl(var(--accent))] text-neon" />
            </div>
            <div className="min-w-0">
              <div
                className="font-display text-lg font-[720] tracking-[-0.02em]"
                data-testid="text-wallet-title"
              >
                Wallet login
              </div>
              <div
                className="text-xs text-muted-foreground"
                data-testid="text-wallet-subtitle"
              >
                Connect your wallet to personalize access.
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={connect}
          disabled={!canConnect || status === "connecting"}
          className={cn(
            "shadow-soft neon-ring",
            status === "connecting" && "opacity-80",
          )}
          data-testid="button-walletconnect"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {status === "connected"
            ? "Connected"
            : status === "connecting"
              ? "Connecting"
              : canConnect
                ? "Connect"
                : "No wallet"}
        </Button>
      </div>

      <Separator className="my-3" />

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground" data-testid="text-wallet-status">
          Status: <span className="text-foreground">{status}</span>
        </div>
        <div
          className="truncate rounded-lg border bg-card/60 px-2 py-1 font-mono text-[11px]"
          data-testid="text-wallet-address"
        >
          {address ? shortAddr(address) : "Not connected"}
        </div>
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground" data-testid="text-wallet-note">
        Prototype login (client-only). For true WalletConnect + sessions we need a real
        WalletConnect projectId and server-side verification.
      </div>
    </Card>
  );
}
