# Official Algorithm Site Community Page

1. Resolve dependencies. You must make sure that you have and can execute each
command depending on the platform you use.
```sh
git --version
npm --version
node --version
cargo --version
rustc --version
wasm-pack --version
# It should appear `wasm32-unknown-unknown (installed)` 
rustup target list
```

2. Install environment. You need Cargo to compile the code written in Rust,
that code will be compiled to [Web Assembly](https://webassembly.org/).
```sh
git clone https://github.com/algorithmssite/algorithmssite.github.io
cd algorithmssite.github.io
npm install
# `basic-http-server` It will allow you to create a local web server to test the website.
cargo install basic-http-server
# If you want to install wasm-pack with cargo
cargo install wasm-pack
```

3. Test the website. A web server will be indispensable to view (no problem with being local) the full problem with being local) the entire web content, after executing the command `npm run start` a folder is created `public` where the files that will compose the website will be located.
```sh
npm run start
basic-http-server public
```

## Update dependencies
```
npx npm-check-updates
```
## Components

This website uses Node.js for its deployment, it takes care of copying the HTML files to the public folder, packaging the crate and sass stylesheets, into HTML files to the public folder, packaging the crate and sass stylesheets into a single file to result in a static website where JS usage is minimal.  In this project, unlike traditional static websites, we use Rust for the frontend and the stylesheets are written in sass.

## License

The license of it project is MIT see file *LICENSE* on top dir for more details.
