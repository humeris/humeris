import babel from "@rollup/plugin-babel";
import resolve from '@rollup/plugin-node-resolve';

const extensions = [".ts", ".tsx"];

const config = {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [
    resolve({extensions}),
    babel({
      babelHelpers: "bundled",
      extensions,
    }),
  ],
};

export default config;
