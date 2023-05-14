use crate::translator::response_status;
use crate::Error;

#[derive(Debug, Default, Eq, PartialEq, Clone, serde::Deserialize, serde::Serialize)]
pub struct Qcri {
    /// Your qrci api key. Get one for free here https://mt.qcri.org/api/v1/ref
    pub api_key: String,
    pub domain: String,
}

impl Qcri {
    #[inline(always)]
    pub fn base_url(endpoint: &str) -> String {
        format!("https://mt.qcri.org/api/v1/{endpoint}?")
    }

    pub async fn domains() -> Result<String, Error> {
        let response = reqwest::Client::builder()
            .build()?
            .get(Qcri::base_url("getDomains"))
            .send()
            .await?;

        Ok(response_status(response)?.text().await?)
    }
}
