import rustPlugin from "@wasm-tool/rollup-plugin-rust";
import copyPlugin from "rollup-plugin-copy";
import sassPlugin from 'rollup-plugin-sass';
import livereloadPlugin from 'rollup-plugin-livereload';
import servePlugin from 'rollup-plugin-serve';
import { terserPlugin } from "rollup-plugin-terser";

const is_watch = !!process.env.ROLLUP_WATCH;

const config = {
  input: {
    bundle: "index.js",
    "algorithmssite-page": "Cargo.toml",
  },
  output: {
    dir: "public/js",
    format: 'esm',
    sourcemap: false,
  },
  plugins: [
    copyPlugin({
      targets: [
        { src: "assets/index.html", dest: "public" },
        { src: "assets/images", dest: "public/" },
      ]
    }),
    rustPlugin({}),
    sassPlugin({
      // If you specify true, the plugin will insert compiled CSS into <head/> tag.
      insert: true,
    }),

    !is_watch && terserPlugin(),
  ]
}
if (is_watch) {
  config.plugins = config.plugins.concat([
    servePlugin({
      open: true,
      contentBase: 'public',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    livereloadPlugin('public')
  ])
}

export default config;