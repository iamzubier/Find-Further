// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    optimizeDeps: {
      // Start's browser entry statically imports its server storage module
      // (node:async_hooks). When Vite pre-bundles it, the framework's
      // isomorphic-fn compiler never sees those files, so the server-only
      // branch ships to the browser and the client bundle throws. Serving
      // them unbundled lets the compiler strip that branch.
      exclude: [
        "@tanstack/start-client-core",
        "@tanstack/start-storage-context",
        "@tanstack/start-fn-stubs",
      ],
    },
  },
});
