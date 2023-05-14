use super::qcri::Qcri;
use std::{fmt, str::FromStr};

#[macro_export]
macro_rules! codes_to_languages {
    ( $($key:expr => $value:expr),* ) => {{
        let mut map = std::collections::HashMap::new();
        $( map.insert($key.to_string(), $value.to_string()); )*
        map
    }}
}

pub type LanguagesToCodes = std::collections::HashMap<String, String>;

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
/// Represent a version of translator API, currently is oly used with Deepl
pub enum Version {
    V1,
    #[default]
    V2,
}

impl FromStr for Version {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "v1" => Ok(Version::V1),
            "v2" => Ok(Version::V2),
            _ => Err(()),
        }
    }
}

impl fmt::Display for Version {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Version::V1 => "v1",
            Version::V2 => "v2",
        }
        .fmt(f)
    }
}

/// Enum that wraps engines, which use the translator under the hood to translate word(s)
#[derive(Debug, Default, Eq, PartialEq, Clone, serde::Deserialize, serde::Serialize)]
pub enum Engine {
    #[default]
    Google,
    /// Get one api key here: https://www.deepl.com/docs-api/accessing-the-api/
    Deepl {
        api_key: String,
        version: Version,
        use_free_api: bool,
    },
    /// List of LibreTranslate endpoint can be found at:
    /// https://github.com/LibreTranslate/LibreTranslate#mirrors
    /// Some require an API key
    Libre {
        api_key: String,
        url: String,
    },
    Linguee {
        return_all: bool,
    },
    Microsoft {
        api_key: String,
        region: String,
    },
    MyMemory {
        email: String,
        /// set to True to return all synonym/similars of the translated text
        return_all: bool,
    },
    Papago {
        client_id: String,
        secret_key: String,
    },
    Pons {
        return_all: bool,
    },
    Qcri(Qcri),
    Yandex {
        api_key: String,
        //api_version: String,
    },
}

impl Engine {
    #[inline(always)]
    pub fn base_url(&self) -> String {
        match &self {
            Self::Google => "https://translate.google.com/m".into(),
            Self::Deepl {
                use_free_api,
                version,
                ..
            } => {
                let free = if *use_free_api { "-free" } else { "" };
                format!("https://api{free}/{version}/translate")
            }
            Self::Libre { url, .. } => format!("{url}/translate"),
            Self::Linguee { .. } => "https://www.linguee.com/".into(),
            Self::Microsoft { .. } => {
                "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0".into()
            }
            Self::MyMemory { .. } => "http://api.mymemory.translated.net/get".into(),
            // "https://papago.naver.com/"
            Self::Papago { .. } => "https://openapi.naver.com/v1/papago/n2mt".into(),
            Self::Pons { .. } => "https://en.pons.com/translate/".into(),
            Self::Qcri(..) => Qcri::base_url("translate"),
            Self::Yandex { .. } => "https://translate.yandex.net/api/v1.5/tr.json/translate".into(),
        }
    }

    #[inline(always)]
    pub const fn name(&self) -> &str {
        match &self {
            Self::Google => "Google",
            Self::Deepl { .. } => "Deepl",
            Self::Libre { .. } => "Libre",
            Self::Linguee { .. } => "Linguee",
            Self::Microsoft { .. } => "Microsoft",
            Self::MyMemory { .. } => "MyMemory",
            Self::Papago { .. } => "Papago",
            Self::Pons { .. } => "Pons",
            Self::Qcri(..) => "Qcri",
            Self::Yandex { .. } => "Yandex",
        }
    }

    #[inline(always)]
    pub fn supported_languages(&self) -> LanguagesToCodes {
        match &self {
            Self::Google | Self::MyMemory { .. } | Self::Yandex { .. } => {
                crate::codes_to_languages! {
                    "Afrikaans" => "af",
                    "Albanian" => "sq",
                    "Amharic" => "am",
                    "Arabic" => "ar",
                    "Armenian" => "hy",
                    "Azerbaijani" => "az",
                    "Basque" => "eu",
                    "Belarusian" => "be",
                    "Bengali" => "bn",
                    "Bosnian" => "bs",
                    "Bulgarian" => "bg",
                    "Catalan" => "ca",
                    "Cebuano" => "ceb",
                    "Chichewa" => "ny",
                    "Chinese (simplified)" => "zh-CN",
                    "Chinese (traditional)" => "zh-TW",
                    "Corsican" => "co",
                    "Croatian" => "hr",
                    "Czech" => "cs",
                    "Danish" => "da",
                    "Dutch" => "nl",
                    "English" => "en",
                    "Esperanto" => "eo",
                    "Estonian" => "et",
                    "Filipino" => "tl",
                    "Finnish" => "fi",
                    "French" => "fr",
                    "Frisian" => "fy",
                    "Galician" => "gl",
                    "Georgian" => "ka",
                    "German" => "de",
                    "Greek" => "el",
                    "Gujarati" => "gu",
                    "Haitian creole" => "ht",
                    "Hausa" => "ha",
                    "Hawaiian" => "haw",
                    "Hebrew" => "iw",
                    "Hindi" => "hi",
                    "Hmong" => "hmn",
                    "Hungarian" => "hu",
                    "Icelandic" => "is",
                    "Igbo" => "ig",
                    "Indonesian" => "id",
                    "Irish" => "ga",
                    "Italian" => "it",
                    "Japanese" => "ja",
                    "Javanese" => "jw",
                    "Kannada" => "kn",
                    "Kazakh" => "kk",
                    "Khmer" => "km",
                    "Kinyarwanda" => "rw",
                    "Korean" => "ko",
                    "Kurdish" => "ku",
                    "Kyrgyz" => "ky",
                    "Lao" => "lo",
                    "Latin" => "la",
                    "Latvian" => "lv",
                    "Lithuanian" => "lt",
                    "Luxembourgish" => "lb",
                    "Macedonian" => "mk",
                    "Malagasy" => "mg",
                    "Malay" => "ms",
                    "Malayalam" => "ml",
                    "Maltese" => "mt",
                    "Maori" => "mi",
                    "Marathi" => "mr",
                    "Mongolian" => "mn",
                    "Myanmar" => "my",
                    "Nepali" => "ne",
                    "Norwegian" => "no",
                    "Odia" => "or",
                    "Pashto" => "ps",
                    "Persian" => "fa",
                    "Polish" => "pl",
                    "Portuguese" => "pt",
                    "Punjabi" => "pa",
                    "Romanian" => "ro",
                    "Russian" => "ru",
                    "Samoan" => "sm",
                    "Scots gaelic" => "gd",
                    "Serbian" => "sr",
                    "Sesotho" => "st",
                    "Shona" => "sn",
                    "Sindhi" => "sd",
                    "Sinhala" => "si",
                    "Slovak" => "sk",
                    "Slovenian" => "sl",
                    "Somali" => "so",
                    "Spanish" => "es",
                    "Sundanese" => "su",
                    "Swahili" => "sw",
                    "Swedish" => "sv",
                    "Tajik" => "tg",
                    "Tamil" => "ta",
                    "Tatar" => "tt",
                    "Telugu" => "te",
                    "Thai" => "th",
                    "Turkish" => "tr",
                    "Turkmen" => "tk",
                    "Ukrainian" => "uk",
                    "Urdu" => "ur",
                    "Uyghur" => "ug",
                    "Uzbek" => "uz",
                    "Vietnamese" => "vi",
                    "Welsh" => "cy",
                    "Xhosa" => "xh",
                    "Yiddish" => "yi",
                    "Yoruba" => "yo",
                    "Zulu" => "zu"
                }
            }
            Self::Libre { .. } => crate::codes_to_languages! {
                "English" => "en",
                "Arabic" => "ar",
                "Chinese" => "zh",
                "French" => "fr",
                "German" => "de",
                "Hindi" => "hi",
                "Indonesian" => "id",
                "Irish" => "ga",
                "Italian" => "it",
                "Japanese" => "ja",
                "Korean" => "ko",
                "Polish" => "pl",
                "Portuguese" => "pt",
                "Russian" => "ru",
                "Spanish" => "es",
                "Turkish" => "tr",
                "Vietnamese" => "vi"
            },
            Self::Linguee { .. } => crate::codes_to_languages! {
                "Maltese" => "mt",
                "English" => "en",
                "German" => "de",
                "Bulgarian" => "bg",
                "Polish" => "pl",
                "Portuguese" => "pt",
                "Hungarian" => "hu",
                "Romanian" => "ro",
                "Russian" => "ru",
                // "serbian" => "sr",
                "Dutch" => "nl",
                "Slovakian" => "sk",
                "Greek" => "el",
                "Slovenian" => "sl",
                "Danish" => "da",
                "Italian" => "it",
                "Spanish" => "es",
                "Finnish" => "fi",
                "Chinese" => "zh",
                "French" => "fr",
                // "croatian" => "hr",
                "Czech" => "cs",
                "Laotian" => "lo",
                "Swedish" => "sv",
                "Latvian" => "lv",
                "Estonian" => "et",
                "Japanese" => "ja"
            },
            Self::Microsoft { .. } => crate::codes_to_languages! {
                "Afrikaans" => "af",
                "Amharic" => "am",
                "Arabic" => "ar",
                "Assamese" => "as",
                "Azerbaijani" => "az",
                "Bashkir" => "ba",
                "Bulgarian" => "bg",
                "Bangla" => "bn",
                "Tibetan" => "bo",
                "Bosnian" => "bs",
                "Catalan" => "ca",
                "Czech" => "cs",
                "Welsh" => "cy",
                "Danish" => "da",
                "German" => "de",
                "Divehi" => "dv",
                "Greek" => "el",
                "English" => "en",
                "Spanish" => "es",
                "Estonian" => "et",
                "Basque" => "eu",
                "Persian" => "fa",
                "Finnish" => "fi",
                "Filipino" => "fil",
                "Fijian" => "fj",
                "Faroese" => "fo",
                "French" => "fr",
                "French (Canada)" => "fr-CA",
                "Irish" => "ga",
                "Galician" => "gl",
                "Gujarati" => "gu",
                "Hebrew" => "he",
                "Hindi" => "hi",
                "Croatian" => "hr",
                "Upper Sorbian" => "hsb",
                "Haitian Creole" => "ht",
                "Hungarian" => "hu",
                "Armenian" => "hy",
                "Indonesian" => "id",
                "Inuinnaqtun" => "ikt",
                "Icelandic" => "is",
                "Italian" => "it",
                "Inuktitut" => "iu",
                "Inuktitut (Latin)" => "iu-Latn",
                "Japanese" => "ja",
                "Georgian" => "ka",
                "Kazakh" => "kk",
                "Khmer" => "km",
                "Kurdish (Northern)" => "kmr",
                "Kannada" => "kn",
                "Korean" => "ko",
                "Kurdish (Central)" => "ku",
                "Kyrgyz" => "ky",
                "Lao" => "lo",
                "Lithuanian" => "lt",
                "Latvian" => "lv",
                "Chinese (Literary)" => "lzh",
                "Malagasy" => "mg",
                "Māori" => "mi",
                "Macedonian" => "mk",
                "Malayalam" => "ml",
                "Mongolian (Cyrillic)" => "mn-Cyrl",
                "Mongolian (Traditional)" => "mn-Mong",
                "Marathi" => "mr",
                "Malay" => "ms",
                "Maltese" => "mt",
                "Hmong Daw" => "mww",
                "Myanmar (Burmese)" => "my",
                "Norwegian" => "nb",
                "Nepali" => "ne",
                "Dutch" => "nl",
                "Odia" => "or",
                "Querétaro Otomi" => "otq",
                "Punjabi" => "pa",
                "Polish" => "pl",
                "Dari" => "prs",
                "Pashto" => "ps",
                "Portuguese (Brazil)" => "pt",
                "Portuguese (Portugal)" => "pt-PT",
                "Romanian" => "ro",
                "Russian" => "ru",
                "Slovak" => "sk",
                "Slovenian" => "sl",
                "Samoan" => "sm",
                "Somali" => "so",
                "Albanian" => "sq",
                "Serbian (Cyrillic)" => "sr-Cyrl",
                "Serbian (Latin)" => "sr-Latn",
                "Swedish" => "sv",
                "Swahili" => "sw",
                "Tamil" => "ta",
                "Telugu" => "te",
                "Thai" => "th",
                "Tigrinya" => "ti",
                "Turkmen" => "tk",
                "Klingon (Latin)" => "tlh-Latn",
                "Klingon (pIqaD)" => "tlh-Piqd",
                "Tongan" => "to",
                "Turkish" => "tr",
                "Tatar" => "tt",
                "Tahitian" => "ty",
                "Uyghur" => "ug",
                "Ukrainian" => "uk",
                "Urdu" => "ur",
                "Uzbek (Latin)" => "uz",
                "Vietnamese" => "vi",
                "Yucatec Maya" => "yua",
                "Cantonese (Traditional)" => "yue",
                "Chinese Simplified" => "zh-Hans",
                "Chinese Traditional" => "zh-Hant",
                "Zulu" => "zu"
            },
            Self::Deepl { .. } => crate::codes_to_languages! {
                "Bulgarian" => "bg",
                "Czech" => "cs",
                "Danish" => "da",
                "German" => "de",
                "Greek" => "el",
                "English" => "en",
                "Spanish" => "es",
                "Estonian" => "et",
                "Finnish" => "fi",
                "French" => "fr",
                "Hungarian" => "hu",
                "Italian" => "it",
                "Japanese" => "ja",
                "Lithuanian" => "lt",
                "Latvian" => "lv",
                "Dutch" => "nl",
                "Polish" => "pl",
                "Portuguese" => "pt",
                "Romanian" => "ro",
                "Russian" => "ru",
                "Slovak" => "sk",
                "Slovenian" => "sl",
                "Swedish" => "sv",
                "Chinese" => "zh"
            },

            Self::Papago { .. } => crate::codes_to_languages! {
                 "Korean" => "ko",
                 "English" => "en",
                 "Japanese" => "ja",
                 "Chinese" => "zh-CN",
                 "Chinese Traditional" => "zh-TW",
                 "Spanish" => "es",
                 "French" => "fr",
                 "Vietnamese" => "vi",
                 "Thai" => "th",
                 "Indonesia" =>   "id"
            },

            Self::Pons { .. } => crate::codes_to_languages! {
                 "Arabic" => "ar",
                 "Bulgarian" => "bg",
                 "Chinese" => "zh-cn",
                 "Czech" => "cs",
                 "Danish" => "da",
                 "Dutch" => "nl",
                 "English" => "en",
                 "French" => "fr",
                 "German" => "de",
                 "Greek" => "el",
                 "Hungarian" => "hu",
                 "Italian" => "it",
                 "Latin" => "la",
                 "Norwegian" => "no",
                 "Polish" => "pl",
                 "Portuguese" => "pt",
                 "Russian" => "ru",
                 "Slovenian" => "sl",
                 "Spanish" => "es",
                 "Swedish" => "sv",
                 "Turkish" => "tr",
                 "Elvish" => "elv"
            },

            Self::Qcri(..) => crate::codes_to_languages! {
                "Arabic" => "ar",
                "English" => "en",
                "Spanish" => "es"
            },
        }
    }
}
