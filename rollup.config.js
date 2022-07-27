import rust from "@wasm-tool/rollup-plugin-rust";
import copy from "rollup-plugin-copy";
import sass from 'rollup-plugin-sass'

export default {
  input: {
    style: "assets/sass/style.sass",
    operations: "Cargo.toml",
  },
  output: {
    dir: "public/js",
    format: 'esm',//"iife",
    sourcemap: false,

  },
  plugins: [
    copy({
      targets: [
        { src: "assets/templates/index.html", dest: "public" },
      ]
    }),
    rust({
      serverPath: "js/",
    }),
    sass({
      // insert: true If you specify true, the plugin will insert compiled CSS into <head/> tag.
      //include: ["./assets/sass/*.sass"],
      output: 'public/css/style.css',
    }),
  ]
}
