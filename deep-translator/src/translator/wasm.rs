//! Support for web platform

use wasm_bindgen::prelude::*;
use gloo_utils::format::JsValueSerdeExt;

#[derive(
    Debug,
    Default,
    Copy,
    Clone,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    serde::Deserialize,
    serde::Serialize,
)]
#[wasm_bindgen]
pub enum Version {
    V1,
    #[default]
    V2,
}

impl From<Version> for crate::Version {
    fn from(wasm_version: Version) -> super::Version {
        match wasm_version {
            Version::V1 => super::Version::V1,
            Version::V2 => super::Version::V2,
        }
    }
}

#[derive(Clone, Default)]
#[wasm_bindgen]
pub struct Translator {
    engine: Engine,
    source: JsValue,
    target: JsValue,
    api_key: JsValue,
    domain: JsValue,
    version: Version,
    use_free_api: bool,
    url: JsValue,
    return_all: bool,
    region: JsValue,
    email: JsValue,
    client_id: JsValue,
    secret_key: JsValue,
}

#[wasm_bindgen]
impl Translator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Translator {
            engine: Engine::Google,
            source: "auto".into(),
            target: "en".into(),
            api_key: "".into(),
            domain: "".into(),
            version: Version::V2,
            use_free_api: false,
            url: "".into(),
            return_all: false,
            region: "".into(),
            email: "".into(),
            client_id: "".into(),
            secret_key: "".into(),
        }
    }

    /// use deeptrans::wasm;
    ///
    /// let mut translator = wasm::Translator::new();
    /// let translation =
    ///     wasm::sync_translate(translator, "Texto a traducir".to_string()).await;
    ///
    /// console_log!("{}", translation);
    #[wasm_bindgen]
    pub async fn translate(self, text: String) -> Result<JsValue, JsValue> {
        let translator = crate::Translator::from(self);

        translator
            .translate(&text)
            .await
            .map_err(|err| JsValue::from(err.to_string()))
            .map(|ok| <JsValue as JsValueSerdeExt>::from_serde(&ok).unwrap())
    }

    #[wasm_bindgen(getter, js_name = getEngine)]
    pub fn engine(&self) -> Engine {
        self.engine
    }

    #[wasm_bindgen(getter, js_name = getSource)]
    pub fn source(&self) -> JsValue {
        self.source.clone()
    }

    #[wasm_bindgen(getter, js_name = getTarget)]
    pub fn target(&self) -> JsValue {
        self.target.clone()
    }

    #[wasm_bindgen(getter, js_name = getApiKey)]
    pub fn api_key(&self) -> JsValue {
        self.api_key.clone()
    }

    #[wasm_bindgen(getter, js_name = getDomain)]
    pub fn domain(&self) -> JsValue {
        self.domain.clone()
    }

    #[wasm_bindgen(getter, js_name = getVersion)]
    pub fn version(&self) -> Version {
        self.version
    }

    #[wasm_bindgen(getter, js_name = getUseFreeApi)]
    pub fn use_free_api(&self) -> bool {
        self.use_free_api
    }

    #[wasm_bindgen(getter, js_name = getUrl)]
    pub fn url(&self) -> JsValue {
        self.url.clone()
    }

    #[wasm_bindgen(getter, js_name = getReturnAll)]
    pub fn return_all(&self) -> bool {
        self.return_all
    }

    #[wasm_bindgen(getter, js_name = getRegion)]
    pub fn region(&self) -> JsValue {
        self.region.clone()
    }

    #[wasm_bindgen(getter, js_name = getEmail)]
    pub fn email(&self) -> JsValue {
        self.email.clone()
    }

    #[wasm_bindgen(getter, js_name = getClientId)]
    pub fn client_id(&self) -> JsValue {
        self.client_id.clone()
    }

    #[wasm_bindgen(getter, js_name = getSecretKey)]
    pub fn secret_key(&self) -> JsValue {
        self.secret_key.clone()
    }

    #[wasm_bindgen(setter, js_name = setEngine)]
    pub fn set_engine(&mut self, engine: Engine) {
        self.engine = engine;
    }

    #[wasm_bindgen(setter, js_name = setSource)]
    pub fn set_source(&mut self, source: &str) {
        self.source = JsValue::from(source);
    }

    #[wasm_bindgen(setter, js_name = setTarget)]
    pub fn set_target(&mut self, target: &str) {
        self.target = JsValue::from(target);
    }

    #[wasm_bindgen(setter, js_name = setApiKey)]
    pub fn set_api_key(&mut self, api_key: &str) {
        self.api_key = JsValue::from(api_key);
    }

    #[wasm_bindgen(setter, js_name = setDomain)]
    pub fn set_domain(&mut self, domain: &str) {
        self.domain = JsValue::from(domain);
    }

    #[wasm_bindgen(setter, js_name = setVersion)]
    pub fn set_version(&mut self, version: Version) {
        self.version = version;
    }

    #[wasm_bindgen(setter, js_name = setUseFreeApi)]
    pub fn set_use_free_api(&mut self, use_free_api: bool) {
        self.use_free_api = use_free_api;
    }

    #[wasm_bindgen(setter, js_name = setUrl)]
    pub fn set_url(&mut self, url: &str) {
        self.url = JsValue::from(url);
    }

    #[wasm_bindgen(setter, js_name = setReturnAll)]
    pub fn set_return_all(&mut self, return_all: bool) {
        self.return_all = return_all;
    }

    #[wasm_bindgen(setter, js_name = setRegion)]
    pub fn set_region(&mut self, region: &str) {
        self.region = JsValue::from(region);
    }

    #[wasm_bindgen(setter, js_name = setEmail)]
    pub fn set_email(&mut self, email: &str) {
        self.email = JsValue::from(email);
    }

    #[wasm_bindgen(setter, js_name = setClientId)]
    pub fn set_client_id(&mut self, client_id: &str) {
        self.client_id = JsValue::from(client_id);
    }

    #[wasm_bindgen(setter, js_name = setSecretKey)]
    pub fn set_secret_key(&mut self, secret_key: &str) {
        self.secret_key = JsValue::from(secret_key);
    }
}

#[wasm_bindgen]
#[derive(Debug, Default, Eq, PartialEq, Ord, PartialOrd, Clone, Copy)]
pub enum Engine {
    #[default]
    Google,
    Deepl,
    Libre,
    Linguee,
    Microsoft,
    MyMemory,
    Papago,
    Pons,
    Qcri,
    Yandex,
}

impl From<Translator> for crate::Translator {
    #[inline(always)]
    fn from(wasm_ranslator: Translator) -> crate::Translator {
        use crate::Engine::*;

        let Translator {
            engine,
            source,
            target,
            api_key,
            domain,
            version,
            use_free_api,
            url,
            return_all,
            region,
            email,
            client_id,
            secret_key,
        } = wasm_ranslator;

        let source = source.as_string().unwrap();
        let target = target.as_string().unwrap();
        let api_key = api_key.as_string().unwrap();
        let domain = domain.as_string().unwrap();
        let version = crate::Version::from(version);
        let url = url.as_string().unwrap();
        let region = region.as_string().unwrap();
        let email = email.as_string().unwrap();
        let client_id = client_id.as_string().unwrap();
        let secret_key = secret_key.as_string().unwrap();

        let engine = match engine {
            Engine::Google => Google,
            Engine::Deepl => Deepl {
                api_key,
                version,
                use_free_api,
            },
            Engine::Libre => Libre { api_key, url },
            Engine::Linguee => Linguee { return_all },
            Engine::Microsoft => Microsoft { api_key, region },
            Engine::MyMemory => MyMemory { email, return_all },
            Engine::Papago => Papago {
                client_id,
                secret_key,
            },
            Engine::Pons => Pons { return_all },
            Engine::Qcri => Qcri(super::Qcri { api_key, domain }),
            Engine::Yandex => Yandex { api_key },
        };

        crate::Translator::with_engine(&source, &target, engine)
    }
}
