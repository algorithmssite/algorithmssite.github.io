import app from "./Cargo.toml"
import article from "./assets/sass/article.sass"
import donate from "./assets/sass/donate.sass"
import home from "./assets/sass/home.sass"


export default {
  app: await app(),
  style: {
    "article": article,
    "donate": donate,
    "home": home,
  },
}