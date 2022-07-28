use wasm_bindgen::prelude::*; // , JsCast

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

/*
var scrollPos = 0;
window.addEventListener('scroll', function() {
  if ((document.body.getBoundingClientRect()).top > scrollPos) {
    // ARRIBA
  } else {
    // ABAJO
  }
  scrollPos = (document.body.getBoundingClientRect()).top;
});
*/

#[wasm_bindgen]
pub struct ScrollStatus {
    position: f64,
    document: web_sys::Document,
}

#[wasm_bindgen]
impl ScrollStatus {
    #[wasm_bindgen]
    pub fn on_motion(&mut self) {

        match self.document.body() {
            Some(body) => {
                let top = body.get_bounding_client_rect().top();
                if top != self.position {
                    if top > self.position {
                        // Up...
                    } else {
                        // Down...
                    }

                    self.position = top;
                }
            }
            None => (),
        }
    }
}

use js_sys::{Function, Reflect};
#[wasm_bindgen(start)]
pub fn init_module() -> Result<(), JsValue> {
    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();
    let global_object = js_sys::global();

    let scroll_status = ScrollStatus {
        position: 0.0,
        document,
    };

    Reflect::set(
        &global_object,
        &JsValue::from("scroll_status"),
        &JsValue::from(scroll_status),
    )?;

    window.add_event_listener_with_callback(
        "scroll",
        &Function::new_no_args("scroll_status.on_motion();"),
    )?;

    Ok(())
}
