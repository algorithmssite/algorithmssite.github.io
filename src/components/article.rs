use yew::{html, Component, Context, Html};

pub struct Articles;

impl Component for Articles {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        html! {
            <h1 class="empty"> {"There are currently no published articles"} </h1>
        }
    }
}
