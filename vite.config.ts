import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig({
  server: {
    allowedHosts: ["amusing-troll-readily.ngrok-free.app"],
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart({
      server: {},
    }),
    viteReact(),
    babel({
      exclude: [/[/\\]node_modules[/\\]/, /\0rolldown\/runtime\.js/],
      presets: [reactCompilerPreset()],
    }),
  ],
});

export default config;
