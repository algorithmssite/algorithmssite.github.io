mod components;

use components::*;
use wasm_bindgen::{prelude::*, JsCast};
use web_sys::Element;
use yew::{prelude::*, Renderer};

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (
        log(&format_args!( $( $t )* ).to_string())
    )
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);
}

pub type Links = Vec<(String, String)>;

#[inline(always)]
fn links(raw: &[(&str, &str)]) -> Links {
    raw.iter()
        .map(|(label, url)| (label.to_string(), url.to_string()))
        .collect()
}

#[derive(Clone, Eq, PartialEq, Properties, Debug)]
pub struct AccountProps {
    pub icon: String,
    pub links: Vec<(String, String)>,
}

#[derive(Clone, Eq, PartialEq, Debug)]
struct Account {
    icon: String,
    links: Links,
}

impl Component for Account {
    type Message = ();
    type Properties = AccountProps;

    fn create(ctx: &Context<Self>) -> Self {
        Self {
            icon: ctx.props().icon.clone(),
            links: ctx.props().links.clone(),
        }
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        let last = self.links.last().map(|item| item.1.clone()).unwrap();
        html! {
            <div>
                <img src={format!("/images/{}", &self.icon)} alt="Img" />
                <span>
                    {
                      for self.links.iter().map(|(label, link)| {
                        html! {
                            <>
                            <a href={link.clone()} target="_blank" rel="noopener noreferrer">
                                {label.clone()}
                            </a>
                            { if link != &last {", "} else {""} }
                            </>
                        }
                      })
                    }
                </span>
            </div>
        }
    }
}

#[derive(Eq, PartialEq, Copy, Clone, Debug, Default)]
enum Section {
    #[default]
    Home,
    Articles,
    Donate,
}

#[derive(Default)]
struct App {
    section: Section,
}

impl Component for App {
    type Message = Section;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self::default()
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        if self.section == msg {
            return false;
        }

        self.section = msg;

        let document = web_sys::window().unwrap().document().unwrap();
        let old_select: Element = document
            .query_selector(".custom-button-flat-select")
            .unwrap()
            .unwrap();

        old_select.set_class_name("custom-button-flat pulse-info");
        let nodes = document.query_selector_all(".custom-button-flat").unwrap();
        let new_select = nodes
            .item(msg as u32)
            .unwrap()
            .dyn_into::<Element>()
            .unwrap();
        new_select.set_class_name("custom-button-flat-select pulse-info");
        true
    }

    fn changed(&mut self, _ctx: &Context<Self>, _props: &Self::Properties) -> bool {
        // Should only return "true" if new properties are different to
        // previously received properties.
        // This component has no properties so we will always return "false".

        true
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let telegram = links(&[
            // ("Community", "https://telegram.com"),
            ("Spanish Community", "https://t.me/algorithms_site_es"),
        ]);

        let discord = links(&[("Spanish Community", "https://discord.gg/y3FbsVswQP")]);
        let github = links(&[("Repository", "https://github.com/algorithmssite")]);

        html! {
          <>
            <header>
            <img alt="page logo" src="images/logo2.jpg" />

            <div class="menu-container">
                <button class="custom-button-flat-select pulse-info"
                    onclick={ctx.link().callback(|_| Section::Home)}
                >
                    <span> {"Home"} </span>
                </button>

                <button class="custom-button-flat pulse-info"
                    onclick={ctx.link().callback(|_| Section::Articles)}
                >
                <span> {"Articles"} </span>
                </button>

                <button class="custom-button-flat pulse-info"
                    onclick={ctx.link().callback(|_| Section::Donate)}
                >
                    <span> {"Donate"} </span>
                </button>

            </div>

            </header>
            {
                match self.section {
                    Section::Home => html! { <Home /> },
                    Section::Articles => html! { <Articles /> },
                    Section::Donate => html! { <Donate /> }
                }
            }

            <aside class="contact-us">
                <div class="title"><h1>{"Contact us"} </h1></div>
                <div class="social">
                    <Account icon="telegram.svg" links={telegram}/>
                    <Account icon="discord.svg" links={discord}/>
                    <Account icon="github.svg" links={github}/>
                </div>
            </aside>
            <footer>
                <p>{"Copyright © 2022-present Algorithms Site, All Rights Reserved."}</p>
            </footer>
          </>
        }
    }
}

#[wasm_bindgen]
pub struct ScrollState {
    position: f64,
}

#[wasm_bindgen]
impl ScrollState {
    #[wasm_bindgen]
    pub fn update(&mut self) -> Result<(), JsValue> {
        let body = web_sys::window()
            .unwrap()
            .document()
            .unwrap()
            .body()
            .unwrap();

        let header: web_sys::HtmlElement =
            body.query_selector("header")?.unwrap().dyn_into().unwrap();
        let style = header.style();
        let top = body.get_bounding_client_rect().top();

        if top > self.position {
            style.set_property("visibility", "visible")?;
        } else if top < self.position {
            style.set_property("visibility", "hidden")?;
        }

        self.position = top;

        Ok(())
    }
}

#[wasm_bindgen(start)]
pub async fn run() -> Result<(), JsValue> {
    let document = web_sys::window().unwrap().document().unwrap();
    let mut scroll_state = ScrollState { position: 0.0 };

    let closure =
        Closure::wrap(Box::new(move || scroll_state.update().unwrap()) as Box<dyn FnMut()>);
    document.set_onscroll(Some(closure.as_ref().unchecked_ref()));

    closure.forget(); // Important !!!
    Renderer::<App>::new().render();


    Ok(())
}
