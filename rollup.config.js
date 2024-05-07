import rustPlugin from "@wasm-tool/rollup-plugin-rust";
import copyPlugin from "rollup-plugin-copy";
import sassPlugin from 'rollup-plugin-sass';
import livereloadPlugin from 'rollup-plugin-livereload';
import servePlugin from 'rollup-plugin-serve';

const production = !process.env.ROLLUP_WATCH;

const config = {
  input: {
    bundle: "index.js",
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
    rustPlugin({
      serverPath: "js/",
    }),
    sassPlugin({
      // If you specify true, the plugin will insert compiled CSS into <head/> tag.
      insert: true,
    }),
    ,
  ]
}
if (!production) {
  config.plugins = config.plugins.concat([
    servePlugin({
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