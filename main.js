import operations from "./Cargo.toml"
import sass from "./assets/sass/style.sass"


export default {
  operations: await operations(),
  // This is import but not used directely in the HTML 
  sass: sass,
}