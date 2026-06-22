//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";
import queryPlugin from "@tanstack/eslint-plugin-query";
import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import reactCompiler from "eslint-plugin-react-compiler";
import featureQueryMutationPlugin from "./eslint-rules/feature-query-mutation.js";

export default [
  ...tanstackConfig,
  ...queryPlugin.configs["flat/recommended"],
  cspellESLintPluginRecommended,
  {
    plugins: {
      "feature-query-mutation": featureQueryMutationPlugin,
      "react-compiler": reactCompiler,
    },
    rules: {
      "feature-query-mutation/query-mutation-conventions": "error",
      "react-compiler/react-compiler": "error",
    },
  },
  {
    // Vendored shadcn primitives: not hand-authored to the compiler's rules.
    files: ["src/components/ui/**"],
    rules: {
      "react-compiler/react-compiler": "off",
    },
  },
  {
    files: ["src/**/*.d.ts"],
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off",
    },
  },
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/require-await": "off",
      "@cspell/spellchecker": ["error", { configFile: "./cspell.json" }],
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    // Bilingual (Arabic + English) email copy + the certificate PDF template —
    // spellcheck would flag every Arabic word, same rationale as the
    // cspell-ignored `messages/**`. Must come after the global cspell rule above
    // so it wins in flat-config order.
    files: [
      "src/emails/**",
      "src/jobs/processors/email.processor.tsx",
      "src/features/certificates/lib/certificate-template.ts",
    ],
    rules: {
      "@cspell/spellchecker": "off",
    },
  },
  {
    ignores: [
      "commitlint.config.js",
      "eslint.config.js",
      "eslint-rules/**",
      "prettier.config.js",
      "src/paraglide/**",
      "src/routeTree.gen.ts",
      ".output/**",
      ".nitro/**",
      ".tanstack/**",
    ],
  },
];
