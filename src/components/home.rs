use yew::{html, Component, Context, Html};

pub struct Home;

impl Component for Home {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        let height = web_sys::window()
            .unwrap()
            .outer_height()
            .unwrap()
            .as_f64()
            .unwrap() as usize;

        html! {
            <>
                <article class="welcome" style={ format!("height: {}px;", height) }>
                    <h1> {"Welcome to"} </h1>
                    <h1> {"Official Algorithm Site Community Web Site"} </h1>
                </article>
                <article class="info">
                    <h1>{"About us"} </h1>
                    <div>
                    <p> {"Algorithm Site is an online community currently present on Telegram, Github and Discord. Its beginning on Telegram was as a group to address technological issues from a technical point of view under the name FNX, with the passage of time its name changed along with its main purpose. Then it opened a space on Github, later on Discord... it will be present in other social networks in order to contribute to the development of software at a global level."}
                    <br />
                    <br />
                        {"The intention is just to give people a"} <i>{" site "}</i> {"to talk about"} <i>{" algorithms "}</i> {"(things related to software development), create new ideas, get and give help, share projects, etc."}
                    </p>
                    </div>
                </article>

                <article class="info">
                    <h1>{"Core Team"} </h1>
                    <div>
                    <p>
                        {"Anyone can join this project, voting is one of the tools used for decision making but after a while and fulfilling other requirements... a regular member can lead by being part of the core team. Some members in this team represent the whole community, while others only represent those of a particular social network."}
                    </p>
                    </div>
                </article>
            </>
        }
    }
}
