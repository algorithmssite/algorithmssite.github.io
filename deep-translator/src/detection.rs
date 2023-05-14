//use serde::{Deserialize, Serialize};
use serde_json::Value;

//#[derive(Serialize, Deserialize)]
pub enum QText {
    Str(String),
    ListStr(Vec<String>),
}

impl QText {
    fn is_empty(&self) -> bool {
        match self {
            QText::Str(value) => value.is_empty(),
            QText::ListStr(value) => value.is_empty(),
        }
    }
}
impl From<String> for QText {
    fn from(value: String) -> QText {
        QText::Str(value)
    }
}

impl From<Vec<String>> for QText {
    fn from(value: Vec<String>) -> QText {
        QText::ListStr(value)
    }
}

impl ToString for QText {
    fn to_string(&self) -> String {
        match self {
            QText::Str(value) => value.clone(),
            QText::ListStr(value) => format!("{:?}", &value),
        }
    }
}

/// send a request and return the response body parsed as dictionary
#[allow(unused_mut)]
async fn get_request_body<T: Into<QText>>(text: T, api_key: &str) -> Value {
    debug_assert!(
        !api_key.is_empty(),
        "you need to get an API_KEY for this to work. \n\
        Get one for free here: https://detectlanguage.com/documentation"
    );

    let text = T::into(text);

    debug_assert!(!text.is_empty(), "Please provide an input text");

    let mut client = reqwest::Client::builder();
    #[cfg(not(target_arch = "wasm32"))]
    {
        client = client.user_agent("Detect Language API Rust Client 1.4.0");
    }

    let req: Value = client
        .build()
        .unwrap()
        .post("https://ws.detectlanguage.com/0.2/detect")
        .header("User-Agent", format!("Bearer {api_key}").as_str())
        .json(&serde_json::json!({
            "q": text.to_string()
        }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();

    println!("req -> {:?}", &req);
    req["data"].clone()
}

/// function responsible for detecting the language from a text
pub async fn single(text: &str, api_key: &str, detailed: bool) -> Value {
    let body = get_request_body(text.to_string(), api_key).await;
    println!("body -> {:?}", &body);
    let detections = &body["detections"];

    if detailed {
        return detections[0].clone();
    }

    detections[0]["language"].clone()
}

/// function responsible for detecting the language from a text
pub async fn batch(text_list: Vec<String>, api_key: &str, detailed: bool) -> Vec<Value> {
    let body = get_request_body(text_list, api_key).await;
    println!("body -> {:?}", &body);
    let detections = &body["detections"];

    let Value::Array(detections) = detections else { unreachable!() };
    let res = detections.iter().map(|obj| obj[0].clone()).collect();

    if detailed {
        res
    } else {
        res.iter().map(|obj| obj["language"].clone()).collect()
    }
}
