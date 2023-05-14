mod engine;
mod qcri;
#[cfg(target_arch = "wasm32")]
pub mod wasm;

use crate::Error;
pub use engine::*;
pub use qcri::Qcri;
use reqwest::{Client, ClientBuilder, Response, header::{HeaderMap, HeaderValue}};
use serde_json::Value;
use std::ops::{Deref, DerefMut};

#[inline(always)]
fn response_status(response: Response) -> Result<Response, Error> {
    if response.status() == 429 {
        return Err(Error::TooManyRequests);
    }

    if response.status() != 200 {
        return Err(Error::Request);
    }

    Ok(response)
}

/// A Translator
///```no_run
/// use deeptrans::Translator;
///
/// let mut translator = Translator::new();
/// let translation =
///     translator.translate("Texto a traducir").await;
///
/// println!("{translation}");
///```
#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct Translator {
    pub source: String,
    pub target: String,
    pub engine: Engine,
    #[cfg(not(target_arch = "wasm32"))]
    #[serde(skip)]
    pub proxies: Vec<reqwest::Proxy>,
}

impl Translator {
    #[inline(always)]
    pub fn new(source: &str, target: &str) -> Self {
        Self {
            source: source.to_string(),
            target: target.to_string(),
            ..Self::default()
        }
    }

    #[inline(always)]
    pub fn with_engine(source: &str, target: &str, engine: Engine) -> Self {
        Self {
            engine,
            ..Self::new(source, target)
        }
    }

    #[inline(always)]
    fn client(&self) -> ClientBuilder {
        //let mut headers = HeaderMap::new();
        //headers.insert("Access-Control-Allow-Origin", HeaderValue::from_static("http://127.0.0.1:4000/"));
        //headers.insert("ccess-Control-Request-Method", HeaderValue::from_static("POST"));
        //headers.insert("Access-Control-Request-Headers", HeaderValue::from_static("Content-Type, Authorization"));

        #[allow(unused_mut)]
        let mut client = Client::builder();
        //.default_headers(headers);

        #[cfg(not(target_arch = "wasm32"))]
        for proxy in self.proxies.clone() {
            client = client.proxy(proxy);
        }

        client
    }

    #[inline(always)]
    async fn request<I: Into<Option<String>>>(
        &self,
        url: I,
        url_params: &[(&str, &str)],
    ) -> Result<Response, Error> {
        let url = I::into(url).unwrap_or_else(|| self.base_url());

        // let valid_origin = Header::new("Access-Control-Allow-Origin", "http://127.0.0.1:4000");
        // let xvalid_origin = Header::new("Origin", "http://127.0.0.1:4000");
        // let ctype = Header::new("Content-Type", "application/json");
        let response = self
            .client()
            .build()?
            .get(url)
            .header("Access-Control-Allow-Origin", "http://127.0.0.1:4000") // 3.
            .header("Origin", "http://127.0.0.1:4000")
            .header("Content-Type", "application/json")
            .query(&url_params)
            .send()
            .await?;

        response_status(response)
    }
/*
<?php

$usuarios = array(
    array('nombre' => 'Alex', 'apellido' => 'Escobar', 'telefono' => '3213211212'),
    // En el código original falta una coma al finalizar esta linea
    array('nombre' => 'Juan', 'apellido' => 'Gomez', 'telefono' => '3211231212'),
    array('nombre' => 'Andres', 'apellido' => 'Marín', 'telefono' => '3211112223'),
    array('nombre' => 'Angie', 'apellido' => 'Rivera', 'telefono' => '3211212121')
);

foreach ($usuarios as $usuario) {
    echo $usuario['nombre'].' '.$usuario['apellido'].' '.$usuario['telefono'];
}


?>
*/
    #[inline(always)]
    pub async fn translate(&self, text: &str) -> Result<Value, Error> {
        let text = text.trim();
        if text.is_empty() || self.source == self.target {
            return Ok(Value::String(text.into()));
        }

        match &self.engine {
            Engine::Deepl { api_key, .. } => {
                let response: Value = self
                    .request(
                        None,
                        &[
                            ("auth_key", &api_key[..]),
                            ("source_lang", &self.source),
                            ("target_lang", &self.target),
                            ("text", text),
                        ],
                    )
                    .await?
                    .json()
                    .await?;

                Ok(response["translations"][0]["text"].clone())
            }

            Engine::Google => {
                let response = self
                    .request(
                        None,
                        &[("tl", &self.target), ("sl", &self.source), ("q", text)],
                    )
                    .await?;

                let html = response.text().await?;
                let document = scraper::Html::parse_document(&html);
                let selector = match scraper::Selector::parse("div.result-container") {
                    ok @ Ok(..) => ok,
                    _ => scraper::Selector::parse("div.t0"),
                }
                .map_err(|k| Error::CssParser(format!("{:?}", k.kind)))?;

                if let Some(div) = document.select(&selector).next() {
                    let res = div.text().collect::<String>();
                    Ok(Value::String(res.trim().to_string()))
                } else {
                    Err(Error::TranslationNotFound)
                }
            }
            Engine::Libre { api_key, .. } => {
                let mut url_params = vec![
                    ("q", text),
                    ("source", &self.source),
                    ("target", &self.target),
                    ("format", "text"),
                ];

                if !api_key.is_empty() {
                    url_params.push(("api_key", api_key))
                }

                let response = self
                    .client()
                    .build()?
                    .post(self.base_url())
                    .query(&url_params)
                    .send()
                    .await?;

                let data: Value = response_status(response)?.json().await?;
                Ok(data["translatedText"].clone())
            }
            Engine::Linguee { return_all } => {
                // It url in the other engines would be `.query(&url_params)`
                let url = format!(
                    "{}{}-{}/translation/{text}.html",
                    self.base_url(),
                    &self.source,
                    &self.target
                );

                let response = self.request(url, &[]).await?;

                let html = response_status(response)?.text().await?;
                let document = scraper::Html::parse_document(&html);
                let selector = scraper::Selector::parse("a.dictLink.featured")
                    .map_err(|k| Error::CssParser(format!("{:?}", k.kind)))?;

                let span_selector = scraper::Selector::parse("span.placeholder")
                    .map_err(|k| Error::CssParser(format!("{:?}", k.kind)))?;

                let mut all = document.select(&selector).map(move |a| {
                    let a_text = a.text().collect::<String>();
                    Value::String(
                        if let Some(span) = a.select(&span_selector).next() {
                            let pronoun = span.text().collect::<String>();
                            a_text.replace(pronoun.trim(), "")
                        } else {
                            a_text
                        }
                        .trim()
                        .to_string(),
                    )
                });

                if *return_all {
                    Ok(all.collect::<Value>())
                } else if let Some(firts) = all.next() {
                    Ok(firts)
                } else {
                    Err(Error::TranslationNotFound)
                }
            }
            Engine::Microsoft { api_key, region } => {
                let mut request = self
                    .client()
                    .build()?
                    .post(self.base_url())
                    .header("Ocp-Apim-Subscription-Key", api_key)
                    .header("Content-type", "application/json");

                if !region.is_empty() {
                    request = request.header("Ocp-Apim-Subscription-Region", region);
                }

                let response = request
                    .query(&[
                        ("from", self.source.as_str()),
                        ("to", &self.target),
                        ("text", text),
                    ])
                    .send()
                    .await?;

                let content: Value = response_status(response)?.json().await?;

                let Value::Array(translations_hash) = &content[0]["translations"] else {
                    panic!("{content:?}")
                };

                let all_translations = translations_hash
                    .iter()
                    .map(|translation| translation["text"].clone())
                    .collect::<Vec<Value>>();

                Ok(Value::Array(all_translations))
            }
            Engine::MyMemory { email, return_all } => {
                if text.len() > 500 {
                    return Err(Error::NotValidLength { min: 1, max: 500 });
                }

                let langpair = format!("{}|{}", &self.source, &self.target);
                let mut url_params = vec![("langpair", &langpair[..]), ("q", text)];

                if !email.is_empty() {
                    url_params.push(("de", email))
                }

                let response = self.request(None, &url_params).await?;
                let data: Value = response_status(response)?.json().await?;

                match data
                    .get("responseData")
                    .map(|res| res.get("translatedText"))
                {
                    Some(Some(translation @ Value::String(..))) => Ok(translation.clone()),
                    _ => {
                        let Some(Value::Array(ref all_matches)) = data.get("matches") else {
                            unreachable!();
                        };

                        let mut all_matches = all_matches.iter().map(|xmatch| {
                            let trans @ Value::String(..) = &xmatch["translation"] else {
                                unreachable!();
                            };

                            trans.clone()
                        });

                        if *return_all {
                            Ok(all_matches.next().unwrap())
                        } else {
                            Ok(Value::Array(all_matches.collect()))
                        }
                    }
                }
            }
            Engine::Papago {
                client_id,
                secret_key,
            } => {
                let mut response = self
                    .client()
                    .build()?
                    .post(self.base_url())
                    .header("X-Naver-Client-Id", client_id)
                    .header("X-Naver-Client-Secret", secret_key)
                    .header(
                        "Content-Type",
                        "application/x-www-form-urlencoded; charset=UTF-8",
                    )
                    .form(&[
                        ("source", self.source.as_str()),
                        ("target", &self.target),
                        ("text", text),
                    ])
                    .send()
                    .await?;

                response = response_status(response)?;

                Ok(response.json::<Value>().await?["message"]["result"]["translatedText"].clone())
            }
            Engine::Pons { return_all } => {
                let url = format!(
                    "{}{}-{}/{text}",
                    self.base_url(),
                    &self.source,
                    &self.target
                );
                let response = self.request(url, &[]).await?;

                let html = response_status(response)?.text().await?;
                let document = scraper::Html::parse_document(&html);
                let selector = scraper::Selector::parse("div.target")
                    .map_err(|k| Error::CssParser(format!("{:?}", k.kind)))?;

                let a_selector = scraper::Selector::parse("a")
                    .map_err(|k| Error::CssParser(format!("{:?}", k.kind)))?;

                let mut all = document.select(&selector).map(move |div| {
                    let div_text = div.text().collect::<String>();
                    Value::String(
                        if let Some(span) = div.select(&a_selector).next() {
                            let pronoun = span.text().collect::<String>();
                            div_text.replace(pronoun.trim(), "")
                        } else {
                            div_text
                        }
                        .trim()
                        .to_string(),
                    )
                });

                if *return_all {
                    Ok(all.collect::<Value>())
                } else if let Some(firts) = all.next() {
                    Ok(firts)
                } else {
                    Err(Error::TranslationNotFound)
                }
            }
            Engine::Qcri(Qcri { api_key, domain }) => {
                let response: Value = self
                    .request(
                        None,
                        &[
                            ("key", api_key),
                            ("langpair", &format!("{}-{}", self.source, self.target)),
                            ("domain", domain),
                            ("text", text),
                        ],
                    )
                    .await?
                    .json()
                    .await?;

                Ok(response["translatedText"].clone())
            }
            Engine::Yandex { api_key } => {
                let response = self
                    .client()
                    .build()?
                    .post(self.base_url())
                    .form(&[
                        ("text", text),
                        ("format", "plain"),
                        ("lang", &format!("{}-{}", self.source, self.target)),
                        ("key", api_key),
                    ])
                    .send()
                    .await?;

                let content: Value = response_status(response)?.json().await?;
                Ok(content["text"].clone())
            }
        }
    }

    /// translate directly from file
    pub async fn translate_file(&self, path: &str) -> Result<Value, Error> {
        self.translate(&std::fs::read_to_string(path)?).await
    }

    /// Translate batch of text
    pub async fn translate_batch(&self, batch: &Vec<String>) -> Vec<Result<Value, Error>> {
        let mut res = Vec::new();

        for source_text in batch {
            res.push(self.translate(source_text).await);
        }

        res
    }
}

impl Default for Translator {
    
    fn default() -> Self {
        Translator {
            source: "auto".to_string(),
            target: "en".to_string(),
            engine: Engine::Google,
            #[cfg(not(target_arch = "wasm32"))]
            proxies: Vec::new()
        }
    }
}

impl Eq for Translator {}
impl PartialEq for Translator {
    fn eq(&self, rhl: &Self) -> bool {
        self.source == rhl.source && self.target == rhl.target && self.engine == rhl.engine
    }
}

impl Deref for Translator {
    type Target = Engine;

    fn deref(&self) -> &Self::Target {
        &self.engine
    }
}

impl DerefMut for Translator {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.engine
    }
}
