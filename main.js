import app from "./Cargo.toml"
import sass from "./assets/sass/style.sass"


export default {
  app: await app(),
  sass: sass,
}