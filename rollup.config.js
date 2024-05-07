import rust from "@wasm-tool/rollup-plugin-rust";
import copy from "rollup-plugin-copy";
import sass from 'rollup-plugin-sass';
import livereload from 'rollup-plugin-livereload';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: {
    bundle: "main.mjs",
  },
  output: {
    dir: "public/js",
    format: 'esm',
    sourcemap: false,
  },
  plugins: [
    copy({
      targets: [
        { src: "assets/index.html", dest: "public" },
        { src: "assets/images", dest: "public/" },
      ]
    }),
    rust({
      serverPath: "js/",
    }),
    sass({
      // If you specify true, the plugin will insert compiled CSS into <head/> tag.
      insert: true,
    }),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),
  ]
}
