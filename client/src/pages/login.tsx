import { useState, useEffect } from "react";
import { Handshake, Wallet, ShieldX } from "lucide-react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import type { Provider } from "ethers";
import "@/lib/web3modal"; // Initialize AppKit

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Client-side approved wallets (case-insensitive check)
const APPROVED_WALLETS: Record<string, string> = {
  "0xf391eee70a073e9ed53ebd3b9836644fdfe1b7c6": "Alex",
  "0xe701998a8fe6523b053df9d9a2e300f7bb27e320": "Joseph",
};

function verifyWallet(address: string): { authorized: boolean; userName?: string } {
  const entry = APPROVED_WALLETS[address.toLowerCase()];
  return entry ? { authorized: true, userName: entry } : { authorized: false };
}

type Props = {
  onAuthenticated: (address: string, userName: string) => void;
};

export default function LoginPage({ onAuthenticated }: Props) {
  const [status, setStatus] = useState<"idle" | "connecting" | "verifying" | "denied">("idle");
  const [error, setError] = useState<string | null>(null);
  const [deniedAddress, setDeniedAddress] = useState<string | null>(null);

  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  // When wallet connects via AppKit, verify
  useEffect(() => {
    if (isConnected && address && status !== "denied") {
      setStatus("verifying");
      const result = verifyWallet(address);
      if (result.authorized) {
        onAuthenticated(address, result.userName || "User");
      } else {
        setDeniedAddress(address);
        setStatus("denied");
      }
    }
  }, [isConnected, address]);

  async function handleLogin() {
    setStatus("connecting");
    setError(null);

    try {
      // Try injected wallet first (MetaMask etc.)
      const eth = (window as any).ethereum;
      if (eth) {
        await eth.request({ method: "eth_requestAccounts" });
        const provider = new BrowserProvider(eth);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();

        setStatus("verifying");
        const result = verifyWallet(addr);

        if (result.authorized) {
          onAuthenticated(addr, result.userName || "User");
        } else {
          setDeniedAddress(addr);
          setStatus("denied");
        }
      } else {
        // No injected wallet — open AppKit modal (shows QR for WalletConnect)
        const { appKit } = await import("@/lib/web3modal");
        appKit.open();
        setStatus("idle");
      }
    } catch (err: any) {
      if (err?.code === 4001) {
        setStatus("idle");
        return;
      }
      setError(err?.message || "Connection failed");
      setStatus("idle");
    }
  }

  function handleQRLogin() {
    // Always open AppKit modal for QR scanning
    import("@/lib/web3modal").then(({ appKit }) => {
      appKit.open();
    });
  }

  function handleTryAgain() {
    setStatus("idle");
    setError(null);
    setDeniedAddress(null);
    // Disconnect from AppKit if connected
    import("@/lib/web3modal").then(({ appKit }) => {
      appKit.disconnect?.();
    });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background crt-lines noise">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 bg-radial" />
      <div className="absolute inset-0 bg-radial-2" />
      <Card className="relative z-10 glass shadow-soft rounded-2xl p-8 max-w-md w-full mx-4 neon-accent">
        <div className="flex flex-col items-center text-center">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl border bg-card/70 shadow-soft neon-ring mb-6"
            data-testid="badge-logo"
          >
            <Handshake className="h-8 w-8 text-[hsl(var(--primary))] text-neon" strokeWidth={2.4} />
          </div>

          <h1
            className="font-display text-3xl font-[720] tracking-[-0.03em] mb-2"
            data-testid="text-app-title"
          >
            Synergy
          </h1>

          <p
            className="text-sm text-muted-foreground mb-8"
            data-testid="text-app-tagline"
          >WORKFLOW TERMINAL</p>

          {status === "denied" ? (
            <div className="w-full">
              <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-destructive/30 bg-destructive/5 mb-6">
                <ShieldX className="h-10 w-10 text-destructive" />
                <div>
                  <p className="font-medium text-destructive" data-testid="text-access-denied">
                    Access Denied
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your wallet is not authorized to access this workspace.
                  </p>
                  {deniedAddress && (
                    <p className="text-xs text-muted-foreground/70 mt-2 font-mono break-all">
                      {deniedAddress}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="w-full shadow-soft"
                data-testid="button-try-again"
              >
                Try Different Wallet
              </Button>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <Button
                onClick={handleLogin}
                disabled={status === "connecting" || status === "verifying"}
                className={cn(
                  "w-full shadow-soft neon-ring h-12 text-base",
                  (status === "connecting" || status === "verifying") && "opacity-80"
                )}
                data-testid="button-login"
              >
                <Wallet className="mr-2 h-5 w-5" />
                {status === "connecting"
                  ? "Connecting..."
                  : status === "verifying"
                    ? "Verifying..."
                    : "Log In"}
              </Button>

              <Button
                onClick={handleQRLogin}
                variant="outline"
                className="w-full h-12 text-base"
                data-testid="button-qr-login"
              >
                QR Code Login
              </Button>

              {error && (
                <p className="mt-4 text-sm text-destructive" data-testid="text-error">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
      <div className="fixed bottom-4 text-center text-xs text-muted-foreground/50">Someday Studios</div>
    </div>
  );
}
