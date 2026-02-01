import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { BrowserProvider } from "ethers";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onConnected?: (address: string) => void;
};

export default function WalletConnectButton({ onConnected }: Props) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">(
    "idle",
  );

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

      setStatus("connected");
      onConnected?.(addr);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <Button
      onClick={connect}
      variant="secondary"
      className={cn(
        "shadow-soft neon-accent",
        status === "connected" && "bg-[hsl(var(--accent)/0.14)] text-foreground",
      )}
      disabled={!canConnect || status === "connecting"}
      data-testid="button-walletconnect"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {status === "connected"
        ? "Wallet connected"
        : status === "connecting"
          ? "Connecting…"
          : canConnect
            ? "Connect wallet"
            : "No wallet"}
    </Button>
  );
}
