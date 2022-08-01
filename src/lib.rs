use wasm_bindgen::{prelude::*, JsCast};
use web_sys::Element;
use yew::prelude::*;
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

struct Home;

impl Component for Home {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        Html::default()
    }
}

struct Articles;

impl Component for Articles {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        Html::default()
    }
}

struct Donate;

impl Component for Donate {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        Html::default()
    }
}

enum Section {
    Home,
    Articles,
    Donate,
}

/*
impl Component for Section {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self::Home
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        match self {
            Self::Home => html! { <Home /> },
            Self::Articles => html! { <Articles /> },
            Self::Donate => html! { <Donate /> },
        }
    }
}
*/
struct Header;

impl Component for Header {
    type Message = Section;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        console_log!("Update it {}", msg as usize);
        // let select = match msg {Home => 0, Articles => 1, Donate => 2 };

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
        false
    }

    fn changed(&mut self, _ctx: &Context<Self>) -> bool {
        // Should only return "true" if new properties are different to
        // previously received properties.
        // This component has no properties so we will always return "false".
        console_log!("changed it");

        false
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
          <header>
            <img alt="page logo" src="images/logo.svg" />
            <ul>
              <li> <button class="custom-button-flat-select pulse-info"
              onclick={ctx.link().callback(|_| Section::Home)}
              >
                <span> {"Home"} </span>
              </button> </li>

               <li> <button class="custom-button-flat pulse-info"
               onclick={ctx.link().callback(|_| Section::Articles)}
               >
                <span> {"Articles"} </span>
              </button> </li>

               <li> <button class="custom-button-flat pulse-info"
               onclick={ctx.link().callback(|_| Section::Donate)}
               >
                <span> {"Donate"} </span>
              </button> </li>
            </ul>
          </header>
        }
    }
}

struct App;

impl Component for App {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn update(&mut self, _ctx: &Context<Self>, _msg: Self::Message) -> bool {
        true
    }

    fn changed(&mut self, _ctx: &Context<Self>) -> bool {
        // Should only return "true" if new properties are different to
        // previously received properties.
        // This component has no properties so we will always return "false".
        false
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        html! {
          <>
            <Header />
            <nav>
                <h1> {"Welcome"} </h1>
            </nav>
            <main></main>

            <footer>
                <p>{"Copyright © 2022 Algorithms Site, All Rights Reserved."}</p>
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
        // CssStyleDeclaration
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
pub fn run_app() -> Result<(), JsValue> {
    // add_event_listener_with_callback
    let document = web_sys::window().unwrap().document().unwrap();

    let global_object = js_sys::global();

    js_sys::Reflect::set(
        &global_object,
        &JsValue::from("scroll_state"),
        &JsValue::from(ScrollState { position: 0.0 }),
    )?;

    document.set_onscroll(Some(&js_sys::Function::new_with_args(
        "event",
        "scroll_state.update()",
    )));

    yew::start_app::<App>();

    Ok(())
}
/**/