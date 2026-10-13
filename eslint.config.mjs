import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".output/**",
      ".next/**",
      ".tanstack/**",
      ".audit/**",
      ".claude-flow/**",
      "cli/**",
      "drizzle/**",
      "src/routeTree.gen.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXExpressionContainer CallExpression[callee.type='MemberExpression'][callee.property.name='useLoaderData']",
          message:
            "Call useLoaderData once in the component body, then read its accessor in JSX. Calling the hook in a prop getter breaks hydration.",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
