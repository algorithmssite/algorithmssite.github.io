//! # Deep Translator
//!
//! A flexible free and unlimited rust tool to translate between different
//! languages in a simple way using multiple translators
//!
//! ## Compile
//!
//! ```
//! cargo build --release --target x86_64-unknown-linux-gnu
//! ```
//!
//! Note that
//!
use clap::{Arg, ArgAction, Command};
use deeptrans::*;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let matches = clap::Command::new("deep-translator")
        .bin_name("deep-translator")
        .about("Official CLI for Deep Translator")
        .long_about(
            "Does really amazing things to great people. Now let's talk a little
      more in depth about how this subcommand really works. It may take about
      a few lines of text, but that's ok!",
        )
        .subcommand_required(false)
        .arg_required_else_help(false)
        .version(env!("CARGO_PKG_VERSION"))
        .subcommands(vec![
            Command::new("deepl").about("Use Deepl as engine").args(&[
                Arg::new("api-key")
                    .long("--api-key")
                    .takes_value(true)
                    .value_name("API-KEY")
                    .required(true)
                    .help("user api key"),
                Arg::new("version")
                    .long("version")
                    .takes_value(true)
                    .value_parser(["v1", "v2"])
                    .default_value("v2")
                    .value_name("VERSION")
                    .help("use api version"),
                Arg::new("free")
                    .long("--free")
                    .takes_value(false)
                    .action(ArgAction::SetTrue)
                    .help("use free api"),
            ]),
            Command::new("google").about("Use Google as engine"),
            Command::new("libre").about("Use Libre as engine").args(&[
                Arg::new("api-key")
                    .long("--api-key")
                    .takes_value(true)
                    .default_value("")
                    .value_name("API-KEY")
                    .help("user api key"),
                Arg::new("custom")
                    .long("--custom")
                    .takes_value(true)
                    .value_name("EMAIL")
                    .help("you can use a custom endpoint"),
                Arg::new("normal")
                    .long("--normal")
                    .takes_value(false)
                    .action(ArgAction::SetTrue)
                    .help("you want to not use the free api"),
            ]),
            Command::new("linguee").about("Use Linguee as engine").arg(
                Arg::new("synonym")
                    .long("--synonym")
                    .takes_value(false)
                    .action(ArgAction::SetTrue)
                    .help("return all synonym of the translated word"),
            ),
            Command::new("microsoft")
                .about("Use Microsoft as engine")
                .args(&[
                    Arg::new("key")
                        .long("--key")
                        .takes_value(true)
                        .value_name("KEY")
                        .help("user api key"),
                    Arg::new("region")
                        .long("--region")
                        .takes_value(true)
                        .value_name("REGION")
                        .default_value("")
                        .help("region where user is"),
                ]),
            Command::new("mymemory")
                .about("Use MyMemory as engine")
                .args(&[
                    Arg::new("email")
                        .long("--email")
                        .takes_value(true)
                        .value_name("EMAIL")
                        .default_value("")
                        .help("user email"),
                    Arg::new("synonym")
                        .long("--synonym")
                        .takes_value(false)
                        .action(ArgAction::SetTrue)
                        .help("show all synonym/similars of the translated text"),
                ]),
            Command::new("papago").about("Use Papago as engine").args(&[
                Arg::new("id")
                    .long("--id")
                    .takes_value(true)
                    .value_name("ID")
                    .required(true)
                    .help("user id"),
                Arg::new("key")
                    .long("--key")
                    .takes_value(true)
                    .value_name("KEY")
                    .required(true)
                    .help("user uniq key"),
            ]),
            Command::new("pons").about("Use Pons as engine").arg(
                Arg::new("synonym")
                    .long("--synonym")
                    .takes_value(false)
                    .action(ArgAction::SetTrue)
                    .help("return all synonym of the translated word"),
            ),
            Command::new("qcri").about("Use Qcri as engine").args(&[
                Arg::new("key")
                    .long("--key")
                    .takes_value(true)
                    .value_name("KEY")
                    .required(true)
                    .help("user uniq key"),
                Arg::new("domain")
                    .long("--domain")
                    .takes_value(true)
                    .value_name("DOMAIN")
                    .help("a qcri domain"),
            ]),
            Command::new("yandex").about("Use Yandex as engine").arg(
                Arg::new("key")
                    .long("--key")
                    .takes_value(true)
                    .value_name("KEY")
                    .required(true)
                    .help("user uniq key"),
            ),
        ])
        .args(&[
            Arg::new("source")
                .default_value("it")
                .long("--source")
                .takes_value(true)
                .value_name("SOURCE")
                .help("source language to translate from"),
            Arg::new("target")
                .long("--target")
                .takes_value(true)
                .default_value("en")
                .value_name("TARGET")
                .help("target language to translate to"),
            Arg::new("text")
                .long("--text")
                .takes_value(true)
                .default_value("Ciao")
                .value_name("TEXT")
                .help("text you want to translate"),
            Arg::new("languages")
                .long("--languages")
                .takes_value(false)
                .action(ArgAction::SetTrue)
                .help(
                    "all the languages available with the translator. \
                    Run the command deep_translator --engine <translator service> --languages",
                ),
            #[cfg(not(target_arch = "wasm32"))]
            Arg::new("proxy")
                .long("--proxy")
                .takes_value(true)
                .value_name("PROXY")
                .action(ArgAction::Append)
                .help("append proxy to proxies list"),
        ])
        .get_matches();

    let mut translator = Translator::new(
        matches.get_one::<String>("source").unwrap(),
        matches.get_one::<String>("target").unwrap(),
    );

    #[cfg(not(target_arch = "wasm32"))]
    if let Ok(Some(many)) = matches.try_get_many::<String>("proxy") {
        translator.proxies = many.map(reqwest::Proxy::http).collect::<Result<_, _>>()?;
    }

    translator.engine = match matches.subcommand_name() {
        Some(engine) => {
            let sub_m = matches.subcommand_matches(engine).unwrap();

            match engine {
                "deepl" => Engine::Deepl {
                    api_key: sub_m.get_one::<String>("api-key").cloned().unwrap(),
                    version: sub_m.get_one::<String>("version").unwrap().parse().unwrap(),
                    use_free_api: *sub_m.get_one::<bool>("free").unwrap(),
                },
                "libre" => Engine::Libre {
                    api_key: sub_m.get_one::<String>("api-key").cloned().unwrap(),
                    url: if *sub_m.get_one::<bool>("normal").unwrap() {
                        "https://libretranslate.com/".into()
                    } else if let Some(custom) = sub_m.get_one::<String>("custom") {
                        custom.clone()
                    } else {
                        "https://libretranslate.de/".into()
                    },
                },
                "linguee" => Engine::Linguee {
                    return_all: *sub_m.get_one::<bool>("synonym").unwrap(),
                },
                "microsoft" => Engine::Microsoft {
                    api_key: sub_m.get_one::<String>("key").cloned().unwrap(),
                    region: sub_m.get_one::<String>("region").cloned().unwrap(),
                },
                "google" => Engine::Google,
                "mymemory" => Engine::MyMemory {
                    email: sub_m.get_one::<String>("email").cloned().unwrap(),
                    return_all: *sub_m.get_one::<bool>("synonym").unwrap(),
                },
                "papago" => Engine::Papago {
                    client_id: sub_m.get_one::<String>("id").cloned().unwrap(),
                    secret_key: sub_m.get_one::<String>("key").cloned().unwrap(),
                },
                "pons" => Engine::Pons {
                    return_all: *sub_m.get_one::<bool>("synonym").unwrap(),
                },
                "qcri" => Engine::Qcri(Qcri {
                    api_key: sub_m.get_one::<String>("key").cloned().unwrap(),
                    domain: sub_m.get_one::<String>("domain").cloned().unwrap(),
                }),
                "yandex" => Engine::Yandex {
                    api_key: sub_m.get_one::<String>("key").cloned().unwrap(),
                },
                _ => unreachable!(),
            }
        }
        None => Engine::Google,
    };

    if *matches.get_one::<bool>("languages").unwrap() {
        println!(
            "{:?}",
            translator.supported_languages().keys().collect::<Vec<_>>()
        );
    } else {
        let text = matches.get_one::<String>("text").unwrap();
        println!("{:?}", translator.translate(text).await);
    }

    Ok(())
}
