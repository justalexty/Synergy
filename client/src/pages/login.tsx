import { useState, useEffect, useRef } from "react";
import { Handshake, Wallet, ShieldX } from "lucide-react";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import "@/lib/web3modal";

type Props = {
  onAuthenticated: (address: string, userName: string) => void;
};

export default function LoginPage({ onAuthenticated }: Props) {
  const [status, setStatus] = useState<"idle" | "connecting" | "verifying" | "denied">("idle");
  const [error, setError] = useState<string | null>(null);
  const pendingVerification = useRef(false);
  
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    async function verifyWallet() {
      if (isConnected && address && pendingVerification.current) {
        pendingVerification.current = false;
        setStatus("verifying");
        setError(null);

        try {
          console.log("[login:effect] Calling /api/auth/verify for", address);
          const res = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: address }),
          });

          console.log("[login:effect] Response status:", res.status);
          const data = await res.json();
          console.log("[login:effect] Response data:", JSON.stringify(data));

          if (data.authorized === true) {
            console.log("[login:effect] Authorized!");
            onAuthenticated(address, data.userName || "User");
          } else {
            console.log("[login:effect] Not authorized, data.authorized =", data.authorized);
            setStatus("denied");
          }
        } catch (err: any) {
          console.error("[login:effect] Error:", err);
          setError(err?.message || "Verification failed");
          setStatus("idle");
        }
      }
    }

    verifyWallet();
  }, [isConnected, address, onAuthenticated]);

  async function handleLogin() {
    console.log("[login] handleLogin called, isConnected:", isConnected, "address:", address);
    setStatus("connecting");
    setError(null);
    pendingVerification.current = true;

    if (isConnected && address) {
      console.log("[login] Already connected, verifying wallet:", address);
      setStatus("verifying");
      try {
        console.log("[login] Calling /api/auth/verify...");
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address }),
        });

        console.log("[login] Response status:", res.status);
        const data = await res.json();
        console.log("[login] Response data:", JSON.stringify(data));

        if (data.authorized === true) {
          console.log("[login] Authorized! Calling onAuthenticated");
          onAuthenticated(address, data.userName || "User");
        } else {
          console.log("[login] Not authorized, data.authorized =", data.authorized);
          setStatus("denied");
        }
      } catch (err: any) {
        console.error("[login] Error verifying:", err);
        setError(err?.message || "Verification failed");
        setStatus("idle");
      }
      return;
    }

    try {
      await open();
    } catch (err: any) {
      setError(err?.message || "Connection failed");
      setStatus("idle");
      pendingVerification.current = false;
    }
  }

  async function handleTryAgain() {
    try {
      await disconnect();
    } catch {}
    setStatus("idle");
    setError(null);
    pendingVerification.current = false;
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
                  {address && (
                    <p className="text-xs text-muted-foreground/70 mt-2 font-mono break-all">
                      {address}
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
            <div className="w-full">
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
