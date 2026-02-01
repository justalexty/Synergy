import { useState, useMemo } from "react";
import { Sparkles, Wallet, ShieldX } from "lucide-react";
import { BrowserProvider } from "ethers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  onAuthenticated: (address: string, userName: string) => void;
};

export default function LoginPage({ onAuthenticated }: Props) {
  const [status, setStatus] = useState<"idle" | "connecting" | "verifying" | "denied">("idle");
  const [error, setError] = useState<string | null>(null);

  const canConnect = useMemo(
    () => typeof window !== "undefined" && (window as any).ethereum,
    []
  );

  async function handleLogin() {
    if (!canConnect) return;

    setStatus("connecting");
    setError(null);

    try {
      const eth = (window as any).ethereum;
      await eth.request({ method: "eth_requestAccounts" });

      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setStatus("verifying");

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await res.json();

      if (data.authorized) {
        onAuthenticated(address, data.userName);
      } else {
        setStatus("denied");
      }
    } catch (err: any) {
      setError(err?.message || "Connection failed");
      setStatus("idle");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background crt">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.08),transparent_70%)] pointer-events-none" />
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none grain" />
      <Card className="relative z-10 glass shadow-soft rounded-2xl p-8 max-w-md w-full mx-4 neon-accent">
        <div className="flex flex-col items-center text-center">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl border bg-card/70 shadow-soft neon-ring mb-6"
            data-testid="badge-logo"
          >
            <Sparkles className="h-8 w-8 text-[hsl(var(--accent))] text-neon" />
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
                </div>
              </div>
              <Button
                onClick={() => setStatus("idle")}
                variant="outline"
                className="w-full shadow-soft"
                data-testid="button-try-again"
              >
                Try Different Wallet
              </Button>
            </div>
          ) : (
            <div className="w-full">
              <Button
                onClick={handleLogin}
                disabled={!canConnect || status === "connecting" || status === "verifying"}
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
                    : canConnect
                      ? "Log In"
                      : "No Wallet Detected"}
              </Button>

              {error && (
                <p className="mt-4 text-sm text-destructive" data-testid="text-error">
                  {error}
                </p>
              )}

              {!canConnect && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Please install a Web3 wallet like MetaMask to continue.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
      <div className="fixed bottom-4 text-center text-xs text-muted-foreground/50">
        Wallet-gated access
      </div>
    </div>
  );
}
