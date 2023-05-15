function ___$insertStyle(css) {
    if (!css || typeof window === 'undefined') {
        return;
    }
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = css;
    document.head.appendChild(style);
    return css;
}

let wasm;

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedFloat64Memory0 = null;

function getFloat64Memory0() {
    if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); }
let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_26(arg0, arg1) {
    wasm.wasm_bindgen__convert__closures__invoke0_mut__h6bb3b4fa4544df2e(arg0, arg1);
}

function __wbg_adapter_29(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures__invoke1_mut__h55f9a11720bd601c(arg0, arg1, addHeapObject(arg2));
}

let stack_pointer = 128;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}
function __wbg_adapter_32(arg0, arg1, arg2) {
    try {
        wasm.wasm_bindgen__convert__closures__invoke1_mut_ref__hf37b7a04877954a7(arg0, arg1, addBorrowedObject(arg2));
    } finally {
        heap[stack_pointer++] = undefined;
    }
}

/**
* @returns {Promise<void>}
*/
function run() {
    wasm.run();
}

let cachedUint32Memory0 = null;

function getUint32Memory0() {
    if (cachedUint32Memory0 === null || cachedUint32Memory0.byteLength === 0) {
        cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory0;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getUint32Memory0();
    const slice = mem.subarray(ptr / 4, ptr / 4 + len);
    const result = [];
    for (let i = 0; i < slice.length; i++) {
        result.push(takeObject(slice[i]));
    }
    return result;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_113(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h76f7758df4ed820d(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

/**
*/
const Version = Object.freeze({ V1:0,"0":"V1",V2:1,"1":"V2", });
/**
*/
const Engine = Object.freeze({ Google:0,"0":"Google",Deepl:1,"1":"Deepl",Libre:2,"2":"Libre",Linguee:3,"3":"Linguee",Microsoft:4,"4":"Microsoft",MyMemory:5,"5":"MyMemory",Papago:6,"6":"Papago",Pons:7,"7":"Pons",Qcri:8,"8":"Qcri",Yandex:9,"9":"Yandex", });
/**
*/
class ScrollState {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_scrollstate_free(ptr);
    }
    /**
    */
    update() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scrollstate_update(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
*/
class Translator {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Translator.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_translator_free(ptr);
    }
    /**
    */
    constructor() {
        const ret = wasm.translator_new();
        return Translator.__wrap(ret);
    }
    /**
    * use deeptrans::wasm;
    *
    * let mut translator = wasm::Translator::new();
    * let translation =
    *     wasm::sync_translate(translator, "Texto a traducir".to_string()).await;
    *
    * console_log!("{}", translation);
    * @param {string} text
    * @returns {Promise<any>}
    */
    translate(text) {
        const ptr = this.__destroy_into_raw();
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.translator_translate(ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @returns {number}
    */
    get getEngine() {
        const ret = wasm.translator_getEngine(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @returns {any}
    */
    get getSource() {
        const ret = wasm.translator_getSource(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get getTarget() {
        const ret = wasm.translator_getTarget(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get getApiKey() {
        const ret = wasm.translator_getApiKey(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get getDomain() {
        const ret = wasm.translator_getDomain(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {number}
    */
    get getVersion() {
        const ret = wasm.translator_getVersion(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @returns {boolean}
    */
    get getUseFreeApi() {
        const ret = wasm.translator_getUseFreeApi(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {any}
    */
    get getUrl() {
        const ret = wasm.translator_getUrl(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {boolean}
    */
    get getReturnAll() {
        const ret = wasm.translator_getReturnAll(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {any}
    */
    get getRegion() {
        const ret = wasm.translator_getRegion(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get getEmail() {
        const ret = wasm.translator_getEmail(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get getClientId() {
        const ret = wasm.translator_getClientId(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get getSecretKey() {
        const ret = wasm.translator_getSecretKey(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {number} engine
    */
    set setEngine(engine) {
        wasm.translator_set_setEngine(this.__wbg_ptr, engine);
    }
    /**
    * @param {string} source
    */
    set setSource(source) {
        const ptr0 = passStringToWasm0(source, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.translator_set_setSource(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {string} target
    */
    set setTarget(target) {
        const ptr0 = passStringToWasm0(target, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.translator_set_setTarget(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {string} api_key
    */
    set setApiKey(api_key) {
        const ptr0 = passStringToWasm0(api_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.translator_set_setApiKey(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {string} domain
    */
    set setDomain(domain) {
        const ptr0 = passStringToWasm0(domain, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.translator_set_setDomain(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {number} version
    */
    set setVersion(version) {
        wasm.translator_set_setVersion(this.__wbg_ptr, version);
    }
    /**
    * @param {boolean} use_free_api
    */
    set setUseFreeApi(use_free_api) {
        wasm.translator_set_setUseFreeApi(this.__wbg_ptr, use_free_api);
    }
    /**
    * @param {string} url
    */
    set setUrl(url) {
        const ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.translator_set_setUrl(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {boolean} return_all
    */
    set setReturnAll(return_all) {
        wasm.translator_set_setReturnAll(this.__wbg_ptr, return_all);
    }
    /**
    * @param {string} region
    */
    set setRegion(region) {
        const ptr0 = passStringToWasm0(region, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.translator_set_setRegion(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {string} email
    */
    set setEmail(email) {
        const ptr0 = passStringToWasm0(email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.translator_set_setEmail(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {string} client_id
    */
    set setClientId(client_id) {
        const ptr0 = passStringToWasm0(client_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.translator_set_setClientId(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {string} secret_key
    */
    set setSecretKey(secret_key) {
        const ptr0 = passStringToWasm0(secret_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.translator_set_setSecretKey(this.__wbg_ptr, ptr0, len0);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbg_instanceof_Window_f2bf9e8e91f1be0d = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Window;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_document_a11e2f345af07033 = function(arg0) {
        const ret = getObject(arg0).document;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_querySelector_d96bcd0615189348 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setclassName_f97c6ecc11848fdf = function(arg0, arg1, arg2) {
        getObject(arg0).className = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_querySelectorAll_d8aff6a3d5fa577e = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).querySelectorAll(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_item_5c132fff33308e6e = function(arg0, arg1) {
        const ret = getObject(arg0).item(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_Element_4a31fb648ff28399 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Element;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_outerHeight_81fae426cb19a0bb = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).outerHeight;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_get_363c3b466fe4896b = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_HtmlInputElement_8074f39ec717e1ff = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof HTMLInputElement;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_select_564b61b9a1b79652 = function(arg0) {
        getObject(arg0).select();
    };
    imports.wbg.__wbg_value_7a0dd72b70bbc491 = function(arg0, arg1) {
        const ret = getObject(arg1).value;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_instanceof_HtmlDocument_bf4a532a7c1839ea = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof HTMLDocument;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_execCommand_b91f88afb9e12908 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).execCommand(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setvalue_841fd0aacdbc126c = function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_instanceof_HtmlElement_edb6b41b4b7de6a7 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof HTMLElement;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_newnoargs_e643855c6572a4a8 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setonclick_2c24d93e1056183c = function(arg0, arg1) {
        getObject(arg0).onclick = getObject(arg1);
    };
    imports.wbg.__wbg_setTimeout_250d9729242b4d13 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).setTimeout(getObject(arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithargs_7dee79b716b7ab05 = function(arg0, arg1, arg2, arg3) {
        const ret = new Function(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_abort_fc21064a02fb6dad = function(arg0) {
        getObject(arg0).abort();
    };
    imports.wbg.__wbg_new_7befa02319b36069 = function() {
        const ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_4d857178afd2211a = function() { return handleError(function () {
        const ret = new Headers();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_append_0df83a5c7a83dc6e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_signal_f51e3a3e000309e1 = function(arg0) {
        const ret = getObject(arg0).signal;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_Response_b1d8fb5649a38770 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Response;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_status_27590aae3bea771c = function(arg0) {
        const ret = getObject(arg0).status;
        return ret;
    };
    imports.wbg.__wbg_url_8e528fd65523cbe8 = function(arg0, arg1) {
        const ret = getObject(arg1).url;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_headers_f42dee5c0830a8b9 = function(arg0) {
        const ret = getObject(arg0).headers;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_next_5a9700550e162aa3 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).next();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_done_a184612220756243 = function(arg0) {
        const ret = getObject(arg0).done;
        return ret;
    };
    imports.wbg.__wbg_value_6cc144c1d9645dd5 = function(arg0) {
        const ret = getObject(arg0).value;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stringify_9003c389758d16d4 = function() { return handleError(function (arg0) {
        const ret = JSON.stringify(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_arrayBuffer_8b744cc30bbf8d4d = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).arrayBuffer();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_bc5d9aad3f9ac80e = function(arg0) {
        const ret = new Uint8Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_length_d9c4ded7e708c6a1 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_text_01d2781c04763803 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).text();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_body_483afe07b0958d3b = function(arg0) {
        const ret = getObject(arg0).body;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_querySelector_f21481e1e6c1b6b8 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_style_490ba346de45c9a1 = function(arg0) {
        const ret = getObject(arg0).style;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getBoundingClientRect_b8fe0d836382ad77 = function(arg0) {
        const ret = getObject(arg0).getBoundingClientRect();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_top_8fe099fb12c73721 = function(arg0) {
        const ret = getObject(arg0).top;
        return ret;
    };
    imports.wbg.__wbg_setProperty_66e3a889ea358430 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).setProperty(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_setonscroll_be083c56204cf681 = function(arg0, arg1) {
        getObject(arg0).onscroll = getObject(arg1);
    };
    imports.wbg.__wbg_lastChild_72821e598853b527 = function(arg0) {
        const ret = getObject(arg0).lastChild;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_removeChild_02e786dfd49af23d = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).removeChild(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_log_a676c684cb7bfd57 = function(arg0, arg1) {
        console.log(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_new_abda76e883ba8a5f = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_658279fe44541cf6 = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_error_f851667af71bcfc6 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1);
        }
    };
    imports.wbg.__wbg_new_113855d7ab252420 = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_113(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            const ret = new Promise(cb0);
            return addHeapObject(ret);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = takeObject(arg0).original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbg_parse_4457078060869f55 = function() { return handleError(function (arg0, arg1) {
        const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_call_35782e9a1aa5e091 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_iterator_c1677479667ea090 = function() {
        const ret = Symbol.iterator;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'function';
        return ret;
    };
    imports.wbg.__wbg_call_f96b398515635514 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = getObject(arg0);
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbg_next_3975dcca26737a22 = function(arg0) {
        const ret = getObject(arg0).next;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_self_b9aad7f1c618bfaf = function() { return handleError(function () {
        const ret = self.self;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_window_55e469842c98b086 = function() { return handleError(function () {
        const ret = window.window;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_globalThis_d0957e302752547e = function() { return handleError(function () {
        const ret = globalThis.globalThis;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_global_ae2f87312b8987fb = function() { return handleError(function () {
        const ret = global.global;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_buffer_fcbfb6d88b2732e9 = function(arg0) {
        const ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_4b3aa8445ac1e91c = function(arg0, arg1, arg2) {
        getObject(arg0).set(getObject(arg1), arg2 >>> 0);
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_92c251989c485785 = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_has_99783608c80c4a1d = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.has(getObject(arg0), getObject(arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fetch_9757442297aa6820 = function(arg0, arg1) {
        const ret = getObject(arg0).fetch(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_fetch_56a6919da5e4c21c = function(arg0) {
        const ret = fetch(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_e63d52e7716df424 = function() { return handleError(function () {
        const ret = new AbortController();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_then_cde1713a812adbda = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_resolve_f3a7b38cd2af0fa4 = function(arg0) {
        const ret = Promise.resolve(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_65c9631eb0022205 = function(arg0, arg1) {
        const ret = getObject(arg0).then(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_bc33b7c3be9319b5 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithstrandinit_8e1c089763754d1e = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_is_92a0f96fd97f04e4 = function(arg0, arg1) {
        const ret = Object.is(getObject(arg0), getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_nextSibling_560b2649c19c5c20 = function(arg0) {
        const ret = getObject(arg0).nextSibling;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_insertBefore_e1afabe0dc2c2cbe = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).insertBefore(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setnodeValue_6d8e3e661b6c5bbc = function(arg0, arg1, arg2) {
        getObject(arg0).nodeValue = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_namespaceURI_805ae4308cd0fb9e = function(arg0, arg1) {
        const ret = getObject(arg1).namespaceURI;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_createElementNS_119bddb989bf0a0f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = getObject(arg0).createElementNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_createElement_5281e2aae74efc9d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setchecked_953abb25006aae1a = function(arg0, arg1) {
        getObject(arg0).checked = arg1 !== 0;
    };
    imports.wbg.__wbg_setvalue_5c9526d147cf6984 = function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_createTextNode_30215f8ff2f87080 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).createTextNode(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_appendChild_173b88a25c048f2b = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).appendChild(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_error_71d6845bf00a930f = function(arg0, arg1) {
        var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 4);
        console.error(...v0);
    };
    imports.wbg.__wbg_setinnerHTML_39068b9492d9a4af = function(arg0, arg1, arg2) {
        getObject(arg0).innerHTML = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_children_ca44f455512575f0 = function(arg0) {
        const ret = getObject(arg0).children;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_from_3ebaf0246cc5c01a = function(arg0) {
        const ret = Array.from(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_length_070e3265c186df02 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_get_e52aaca45f37b337 = function(arg0, arg1) {
        const ret = getObject(arg0)[arg1 >>> 0];
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setsubtreeid_d32e6327eef1f7fc = function(arg0, arg1) {
        getObject(arg0).__yew_subtree_id = arg1 >>> 0;
    };
    imports.wbg.__wbg_addEventListener_808d915acd4d2282 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3), getObject(arg4));
    }, arguments) };
    imports.wbg.__wbg_composedPath_a4e2347389be55ec = function(arg0) {
        const ret = getObject(arg0).composedPath();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_cachekey_b61393159c57fd7b = function(arg0, arg1) {
        const ret = getObject(arg1).__yew_subtree_cache_key;
        getInt32Memory0()[arg0 / 4 + 1] = isLikeNone(ret) ? 0 : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    };
    imports.wbg.__wbg_subtreeid_e348577f7ef777e3 = function(arg0, arg1) {
        const ret = getObject(arg1).__yew_subtree_id;
        getInt32Memory0()[arg0 / 4 + 1] = isLikeNone(ret) ? 0 : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    };
    imports.wbg.__wbg_bubbles_74d6d64883d60b1d = function(arg0) {
        const ret = getObject(arg0).bubbles;
        return ret;
    };
    imports.wbg.__wbg_parentElement_a37a694bf4be8540 = function(arg0) {
        const ret = getObject(arg0).parentElement;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_parentNode_dc21739b5a2033b3 = function(arg0) {
        const ret = getObject(arg0).parentNode;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_ShadowRoot_3e796375af0c57b0 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof ShadowRoot;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_host_89e2b7dca4c8698d = function(arg0) {
        const ret = getObject(arg0).host;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setcachekey_80183b7cfc421143 = function(arg0, arg1) {
        getObject(arg0).__yew_subtree_cache_key = arg1 >>> 0;
    };
    imports.wbg.__wbg_cancelBubble_38e6e6bc61c2b264 = function(arg0) {
        const ret = getObject(arg0).cancelBubble;
        return ret;
    };
    imports.wbg.__wbg_listenerid_12315eee21527820 = function(arg0, arg1) {
        const ret = getObject(arg1).__yew_listener_id;
        getInt32Memory0()[arg0 / 4 + 1] = isLikeNone(ret) ? 0 : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    };
    imports.wbg.__wbg_setlistenerid_3183aae8fa5840fb = function(arg0, arg1) {
        getObject(arg0).__yew_listener_id = arg1 >>> 0;
    };
    imports.wbg.__wbg_setAttribute_e8e8474a029723cb = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_value_3fd0a672660967e3 = function(arg0, arg1) {
        const ret = getObject(arg1).value;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_removeAttribute_cb0c24f7c8064e7e = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).removeAttribute(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbindgen_closure_wrapper260 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 10, __wbg_adapter_26);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper1695 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 10, __wbg_adapter_29);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper2560 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 10, __wbg_adapter_32);
        return addHeapObject(ret);
    };

    return imports;
}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedFloat64Memory0 = null;
    cachedInt32Memory0 = null;
    cachedUint32Memory0 = null;
    cachedUint8Memory0 = null;

    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;

    const imports = __wbg_get_imports();

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(input) {
    if (wasm !== undefined) return wasm;


    const imports = __wbg_get_imports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    const { instance, module } = await __wbg_load(await input, imports);

    return __wbg_finalize_init(instance, module);
}

var exports = /*#__PURE__*/Object.freeze({
    __proto__: null,
    run: run,
    Version: Version,
    Engine: Engine,
    ScrollState: ScrollState,
    Translator: Translator,
    initSync: initSync,
    'default': __wbg_init
});

var app = async (opt = {}) => {
                let {importHook, serverPath} = opt;

                let path = "js/assets/algorithmssite_page-5d0e837c.wasm";

                if (serverPath != null) {
                    path = serverPath + /[^\/\\]*$/.exec(path)[0];
                }

                if (importHook != null) {
                    path = importHook(path);
                }

                await __wbg_init(path);
                return exports;
            };

var article = ___$insertStyle("body {\n  padding: 0px;\n  margin: 0px;\n  text-align: center;\n  background-color: rgba(228, 228, 228, 0.5);\n}\n\np {\n  font-size: 14px;\n}\n\n.hidden-flow {\n  overflow: hidden;\n}\n\nheader {\n  top: 0;\n  display: flex;\n  position: fixed;\n  align-items: center;\n  align-content: center;\n  justify-content: space-between;\n  background-color: rgba(170, 198, 188, 0.95);\n  width: 100%;\n}\nheader img {\n  margin-left: 5px;\n  width: 100px;\n  height: 50px;\n}\nheader menu-container {\n  list-style: none;\n  padding-inline-start: 0px;\n  margin-inline-start: 0px;\n  display: inline-flex;\n  justify-content: space-between;\n  flex-direction: row;\n  margin-right: 20px;\n  width: 30%;\n}\n\n.centered {\n  margin-right: auto;\n  margin-left: auto;\n  display: block;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: #505050;\n  font-size: 24px;\n  font-family: Ubuntu-Light, Helvetica, sans-serif;\n  text-align: center;\n}\n\n/* ---------------------------------------------- */\n/* Loading animation from https://loading.io/css/ */\n.lds-dual-ring {\n  display: inline-block;\n  width: 24px;\n  height: 24px;\n}\n\n.lds-dual-ring:after {\n  content: \" \";\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin: 0px;\n  border-radius: 50%;\n  border: 3px solid #333;\n  border-color: #333 transparent #333 transparent;\n  animation: lds-dual-ring 1.2s linear infinite;\n}\n\n@keyframes lds-dual-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.custom-button-flat {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.custom-button-flat-select {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.pulse-info:hover {\n  box-shadow: rgb(150, 168, 148) 2px 2px 5px 2px;\n}\n\n.social {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-around;\n  background-color: transparent;\n}\n\naside.contact-us {\n  font-size: 12px;\n  padding-bottom: 10px;\n  text-align: left;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  margin: 10px 20px;\n  background-color: rgba(150, 168, 148, 0.5);\n  border-radius: 0px 0px 10px 10px;\n}\naside.contact-us div {\n  background-color: transparent;\n}\naside.contact-us .title {\n  margin-bottom: 30px;\n  background-color: transparent;\n  text-align: center;\n}\naside.contact-us a {\n  text-decoration: none;\n  color: black;\n}\naside.contact-us a:hover {\n  text-decoration: underline;\n  color: #575757;\n}\n\naside.contact-us img {\n  width: 50px;\n  hight: 50px;\n  margin-left: 10px;\n}\n\nfooter {\n  width: 100%;\n  text-align: center;\n  background-color: rgba(150, 168, 148, 0.5);\n  padding: 10px 0px;\n}\n\n.not-found {\n  margin: 250px 0px 10px 0px;\n  display: flex;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: flex-start;\n  justify-content: space-around;\n  align-items: flex-start;\n}\n.not-found div {\n  width: 50%;\n}\n.not-found div h1 {\n  border-bottom: solid;\n}\n.not-found div p {\n  margin: 0px 0px 250px 0px;\n}\n\nmain {\n  margin-top: 100px;\n}\n\n.empty {\n  margin: 250px 0px 250px 0px;\n}\n\n.article-title {\n  margin-bottom: 50px;\n}\n\n.article-widget {\n  width: 290px;\n  margin: 10px;\n  padding: 10px;\n}\n.article-widget:hover {\n  background-color: rgba(255, 255, 255, 0.2);\n}\n.article-widget .article-widget-short {\n  margin: 5px 0px;\n}\n.article-widget .article-widget-author {\n  text-align: right;\n}");

var donate = ___$insertStyle("body {\n  padding: 0px;\n  margin: 0px;\n  text-align: center;\n  background-color: rgba(228, 228, 228, 0.5);\n}\n\np {\n  font-size: 14px;\n}\n\n.hidden-flow {\n  overflow: hidden;\n}\n\nheader {\n  top: 0;\n  display: flex;\n  position: fixed;\n  align-items: center;\n  align-content: center;\n  justify-content: space-between;\n  background-color: rgba(170, 198, 188, 0.95);\n  width: 100%;\n}\nheader img {\n  margin-left: 5px;\n  width: 100px;\n  height: 50px;\n}\nheader menu-container {\n  list-style: none;\n  padding-inline-start: 0px;\n  margin-inline-start: 0px;\n  display: inline-flex;\n  justify-content: space-between;\n  flex-direction: row;\n  margin-right: 20px;\n  width: 30%;\n}\n\n.centered {\n  margin-right: auto;\n  margin-left: auto;\n  display: block;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: #505050;\n  font-size: 24px;\n  font-family: Ubuntu-Light, Helvetica, sans-serif;\n  text-align: center;\n}\n\n/* ---------------------------------------------- */\n/* Loading animation from https://loading.io/css/ */\n.lds-dual-ring {\n  display: inline-block;\n  width: 24px;\n  height: 24px;\n}\n\n.lds-dual-ring:after {\n  content: \" \";\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin: 0px;\n  border-radius: 50%;\n  border: 3px solid #333;\n  border-color: #333 transparent #333 transparent;\n  animation: lds-dual-ring 1.2s linear infinite;\n}\n\n@keyframes lds-dual-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.custom-button-flat {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.custom-button-flat-select {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.pulse-info:hover {\n  box-shadow: rgb(150, 168, 148) 2px 2px 5px 2px;\n}\n\n.social {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-around;\n  background-color: transparent;\n}\n\naside.contact-us {\n  font-size: 12px;\n  padding-bottom: 10px;\n  text-align: left;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  margin: 10px 20px;\n  background-color: rgba(150, 168, 148, 0.5);\n  border-radius: 0px 0px 10px 10px;\n}\naside.contact-us div {\n  background-color: transparent;\n}\naside.contact-us .title {\n  margin-bottom: 30px;\n  background-color: transparent;\n  text-align: center;\n}\naside.contact-us a {\n  text-decoration: none;\n  color: black;\n}\naside.contact-us a:hover {\n  text-decoration: underline;\n  color: #575757;\n}\n\naside.contact-us img {\n  width: 50px;\n  hight: 50px;\n  margin-left: 10px;\n}\n\nfooter {\n  width: 100%;\n  text-align: center;\n  background-color: rgba(150, 168, 148, 0.5);\n  padding: 10px 0px;\n}\n\n.not-found {\n  margin: 250px 0px 10px 0px;\n  display: flex;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: flex-start;\n  justify-content: space-around;\n  align-items: flex-start;\n}\n.not-found div {\n  width: 50%;\n}\n.not-found div h1 {\n  border-bottom: solid;\n}\n.not-found div p {\n  margin: 0px 0px 250px 0px;\n}\n\n.splain {\n  margin: 100px 80px 50px 80px;\n  text-align: left;\n}\n\nsection {\n  margin: 40px 20px;\n}\n\n#donate-dev {\n  margin-top: 80px;\n  width: 100%;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: center;\n  justify-content: space-evenly;\n  align-items: center;\n  text-align: left;\n  font-size: 14px;\n}\n#donate-dev p {\n  width: 85%;\n}\n\n#wallets-container {\n  display: grid;\n  grid-gap: 10px;\n  justify-content: center;\n  align-items: center;\n  margin: 150px 0px;\n  width: 100%;\n  justify-items: center;\n  align-content: space-around;\n  grid-template-columns: repeat(1, 3fr);\n}\n\n@media (min-width: 768px) {\n  #wallets-container {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}\n.wallet-widget {\n  background-color: rgba(120, 150, 120, 0.09);\n  width: 290px;\n  border-radius: 10px;\n  margin: 10px;\n  padding: 10px;\n}\n\n.wallet-widget .wallet-widget-top {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.wallet-widget img {\n  margin: 5px 0px;\n  width: 100px;\n  height: 100px;\n}\n\n.wallet-widget input {\n  text-align: center;\n  width: 250px;\n  height: 25px;\n  font-family: \"IBM Plex Sans\", sans-serif;\n  font-size: 0.875rem;\n  font-weight: 400;\n  line-height: 1.5;\n  border-radius: 15px 0px;\n  cursor: pointer;\n  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;\n}\n\n.wallet-widget input:focus {\n  color: #596882;\n  background-color: #fff;\n  border-color: #7cb2fe;\n  outline: 0;\n  box-shadow: 0 0 0 0.2rem rgba(1, 104, 250, 0.25);\n}");

var home = ___$insertStyle("body {\n  padding: 0px;\n  margin: 0px;\n  text-align: center;\n  background-color: rgba(228, 228, 228, 0.5);\n}\n\np {\n  font-size: 14px;\n}\n\n.hidden-flow {\n  overflow: hidden;\n}\n\nheader {\n  top: 0;\n  display: flex;\n  position: fixed;\n  align-items: center;\n  align-content: center;\n  justify-content: space-between;\n  background-color: rgba(170, 198, 188, 0.95);\n  width: 100%;\n}\nheader img {\n  margin-left: 5px;\n  width: 100px;\n  height: 50px;\n}\nheader menu-container {\n  list-style: none;\n  padding-inline-start: 0px;\n  margin-inline-start: 0px;\n  display: inline-flex;\n  justify-content: space-between;\n  flex-direction: row;\n  margin-right: 20px;\n  width: 30%;\n}\n\n.centered {\n  margin-right: auto;\n  margin-left: auto;\n  display: block;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: #505050;\n  font-size: 24px;\n  font-family: Ubuntu-Light, Helvetica, sans-serif;\n  text-align: center;\n}\n\n/* ---------------------------------------------- */\n/* Loading animation from https://loading.io/css/ */\n.lds-dual-ring {\n  display: inline-block;\n  width: 24px;\n  height: 24px;\n}\n\n.lds-dual-ring:after {\n  content: \" \";\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin: 0px;\n  border-radius: 50%;\n  border: 3px solid #333;\n  border-color: #333 transparent #333 transparent;\n  animation: lds-dual-ring 1.2s linear infinite;\n}\n\n@keyframes lds-dual-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.custom-button-flat {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.custom-button-flat-select {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.pulse-info:hover {\n  box-shadow: rgb(150, 168, 148) 2px 2px 5px 2px;\n}\n\n.social {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-around;\n  background-color: transparent;\n}\n\naside.contact-us {\n  font-size: 12px;\n  padding-bottom: 10px;\n  text-align: left;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  margin: 10px 20px;\n  background-color: rgba(150, 168, 148, 0.5);\n  border-radius: 0px 0px 10px 10px;\n}\naside.contact-us div {\n  background-color: transparent;\n}\naside.contact-us .title {\n  margin-bottom: 30px;\n  background-color: transparent;\n  text-align: center;\n}\naside.contact-us a {\n  text-decoration: none;\n  color: black;\n}\naside.contact-us a:hover {\n  text-decoration: underline;\n  color: #575757;\n}\n\naside.contact-us img {\n  width: 50px;\n  hight: 50px;\n  margin-left: 10px;\n}\n\nfooter {\n  width: 100%;\n  text-align: center;\n  background-color: rgba(150, 168, 148, 0.5);\n  padding: 10px 0px;\n}\n\n.not-found {\n  margin: 250px 0px 10px 0px;\n  display: flex;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: flex-start;\n  justify-content: space-around;\n  align-items: flex-start;\n}\n.not-found div {\n  width: 50%;\n}\n.not-found div h1 {\n  border-bottom: solid;\n}\n.not-found div p {\n  margin: 0px 0px 250px 0px;\n}\n\n.welcome {\n  width: 100%;\n  padding: 100px 0px 0px 0px;\n  background-image: url(../images/logo.svg);\n  background-size: 500px 250px;\n  background-repeat: no-repeat;\n  background-position: center;\n  background-color: rgba(218, 218, 228, 0.3);\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n}\n\n.info {\n  margin: 40px 0px;\n  display: flex;\n  text-align: center;\n  flex-direction: column;\n  align-content: center;\n  justify-content: space-between;\n  align-items: center;\n}\n.info div {\n  text-align: left;\n  width: 60%;\n}");

var main = {
  app: await app(),
  style: {
    "article": article,
    "donate": donate,
    "home": home,
  },
};

export { main as default };
