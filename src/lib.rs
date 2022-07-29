use wasm_bindgen::prelude::*;
use yew::prelude::*;

struct Header;

impl Component for Header {
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
          <header>
            <ul>
              <li> <button class="custom-button-flat pulse-info">
                <span> {"Home"} </span>
              </button> </li>

               <li> <button class="custom-button-flat pulse-info">
                <span> {"Articles"} </span>
              </button> </li>

               <li> <button class="custom-button-flat pulse-info">
                <span> {"Donate"} </span>
              </button> </li>
            </ul>
          </header>
        }
    }
}

struct Home;

impl Component for Home {
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

#[wasm_bindgen(start)]
pub fn run_app() {
    yew::start_app::<Home>();
}