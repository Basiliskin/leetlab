// On-demand code formatting via Prettier. The heavy standalone bundle is
// dynamic-imported so it lands in its own Vite chunk, loaded only on first
// use (matches the CDN-at-runtime approach of tsCompiler).
export async function formatCode(
  code: string,
  lang: "js" | "ts",
): Promise<string> {
  const [{ format }, estree, typescript] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/typescript"),
  ]);
  return format(code, {
    parser: lang === "ts" ? "typescript" : "babel",
    plugins: [estree, typescript],
    semi: true,
    singleQuote: false,
    trailingComma: "es5",
    printWidth: 80,
  });
}
