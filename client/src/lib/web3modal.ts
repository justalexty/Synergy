import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { mainnet } from "@reown/appkit/networks";

const projectId = "89d6083434e5c857f7402c7bba817a49";

const metadata = {
  name: "Synergy",
  description: "Workflow Terminal",
  url: typeof window !== "undefined" ? window.location.origin : "https://justalexty.github.io",
  icons: ["https://justalexty.github.io/Synergy/icon-192.png"],
};

export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [mainnet],
  metadata,
  projectId,
  features: {
    analytics: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#851d52",
  },
});
