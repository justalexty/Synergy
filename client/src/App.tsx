import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import WorkspacePage from "@/pages/workspace";
import LoginPage from "@/pages/login";

type AuthState = {
  authenticated: boolean;
  walletAddress: string | null;
  userName: string | null;
};

function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = sessionStorage.getItem("synergy_auth");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { authenticated: false, walletAddress: null, userName: null };
      }
    }
    return { authenticated: false, walletAddress: null, userName: null };
  });

  useEffect(() => {
    if (auth.authenticated) {
      sessionStorage.setItem("synergy_auth", JSON.stringify(auth));
    } else {
      sessionStorage.removeItem("synergy_auth");
    }
  }, [auth]);

  function handleAuthenticated(walletAddress: string, userName: string) {
    setAuth({ authenticated: true, walletAddress, userName });
  }

  function handleLogout() {
    setAuth({ authenticated: false, walletAddress: null, userName: null });
  }

  if (!auth.authenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <LoginPage onAuthenticated={handleAuthenticated} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/">
            <WorkspacePage userName={auth.userName} onLogout={handleLogout} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
