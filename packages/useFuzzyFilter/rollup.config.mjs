import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts", // Entry point for your hook
  output: [
    {
      dir: "dist",
      format: "esm",
      sourcemap: true,
      preserveModules: true,
      exports: "named",
    },
  ],
  plugins: [typescript()],
  external: ["react"],
};
