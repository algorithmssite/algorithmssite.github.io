use js_sys::{Function, Reflect};
use wasm_bindgen::{prelude::*, JsCast};
use yew::{html, prelude::*, Component, Context, Html};
use web_sys::*;

pub fn copy_addr(event: MouseEvent) -> Result<bool, JsValue> {
    let document = web_sys::window().unwrap().document().unwrap();

    let input = Reflect::get(event.as_ref(), &JsValue::from("srcElement"))?
        .dyn_into::<HtmlInputElement>()?;
    input.select();
    let value = input.value();

    let ret = document.dyn_into::<HtmlDocument>()?.exec_command("copy");
    input.set_value("Copied!");

    let input_as_html = input.dyn_ref::<HtmlElement>().unwrap();
    input_as_html.set_onclick(Some(&Function::new_no_args("")));

    let closure = Closure::wrap(Box::new(move || {
        input.set_value(&value);
        let input_as_html = input.dyn_ref::<HtmlElement>().unwrap();
        input_as_html.set_onclick(Some(&Function::new_with_args("event", "copyAddr(event)")));
    }) as Box<dyn FnMut()>);

    web_sys::window()
        .unwrap()
        .set_timeout_with_callback_and_timeout_and_arguments_0(
            closure.as_ref().unchecked_ref(),
            2000,
        )
        .unwrap();

    closure.forget();

    ret
}

#[derive(Clone, Eq, PartialEq, Properties, Debug)]
pub struct Wallet {
    pub address: String,
    pub coin: String,
    pub coin_alias: String,
    pub icon: String,
}

impl Component for Wallet {
    type Message = ();
    type Properties = Wallet;

    fn create(ctx: &Context<Self>) -> Self {
        ctx.props().clone()
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <article class="wallet-widget">
                <div class="wallet-widget-top">
                    <span> {{ ctx.props().coin.clone() }} </span>
                    <span> {{ ctx.props().coin_alias.clone() }} </span>
                </div>

                <img
                    src={ format!("/images/donate/{}", ctx.props().icon.clone()) }
                    alt="img"
                />
                <div class="wallet-widget-f">
                    <input
                        type="text"
                        value={ ctx.props().address.to_string() }
                        readonly=true
                        onclick={ctx.link().callback(|event| { copy_addr(event).unwrap(); } )}
                    />
                </div>
            </article>
        }
    }
}

pub struct Donate;

impl Component for Donate {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        html! {
            <>
                <div id="donate-dev">
                <p>{
                    r#"The sustainability of this community is based on the different tangible and non-tangible contributions of its members and associated entities, without the gratifying voluntary support, the expansion and maintenance of this community becomes complicated. Naturally, for the moment we are a growing project, we started in 2020 and over time we have added members to our ranks, our message still does not reach all the desired places, we still lack our own domain on the network, we do not have a website, just a nice page on Github Pages, although it really is a quality service the intention is to fully customize a place in the network so that each of our members feel part of a global group, they are not alone, they are not only social networks, they must also have a central place to go, in addition, having a place on the web will host information that through bots will arrive instantly to the different groups in our social networks that allow this type of tools."#
                }
                <br/>
                <br/>
                {
                    r#"
                    The community website could also offer other services to make it easier for employers to find their future employees, among other services that will be considered at a later stage.
                    "#
                }

                </p>

                </div>
                <div id="wallets-container">
                <Wallet
                    address={ "MTUK1HECukkoPUA14mqmJ2JjGKqA6QPHqG".to_string() }
                    coin= { "Litecoin".to_string() }
                    coin_alias={ "LTC".to_string() }
                    icon={ "litecoin.png".to_string() }
                />
                <Wallet
                    address={ "1M3ENrAY2Coqvz1UbPpbtBitt99kJSVHXV".to_string() }
                    coin={ "Bitcoin".to_string() }
                    coin_alias={ "BTC".to_string() }
                    icon={ "bitcoin.png".to_string() }
                />
                <Wallet
                    address={ "0xC60C3F05D612e344a5346BC1870327c7DD560FE7".to_string() }
                    coin={ "Tether".to_string() }
                    coin_alias= { "USDT".to_string() }
                    icon={ "tether.png".to_string() }
                />
                </div>
            </>
        }
    }
}
