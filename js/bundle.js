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

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

const cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedFloat64Memory0 = new Float64Array();

function getFloat64Memory0() {
    if (cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
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

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = new TextEncoder('utf-8');

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
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

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
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
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
function __wbg_adapter_18(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hba24c5ddb200119b(arg0, arg1);
}

function makeClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        try {
            return f(state.a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b);
                state.a = 0;

            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_21(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__Fn__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h9f7b83b84e5f28e3(arg0, arg1, addHeapObject(arg2));
}

/**
*/
function run() {
    wasm.run();
}

let cachedUint32Memory0 = new Uint32Array();

function getUint32Memory0() {
    if (cachedUint32Memory0.byteLength === 0) {
        cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory0;
}

function getArrayJsValueFromWasm0(ptr, len) {
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
/**
*/
class ScrollState {

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

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
            wasm.scrollstate_update(retptr, this.ptr);
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

async function load(module, imports) {
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

function getImports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_abda76e883ba8a5f = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_658279fe44541cf6 = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_error_f851667af71bcfc6 = function(arg0, arg1) {
        try {
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(arg0, arg1);
        }
    };
    imports.wbg.__wbg_warn_0b90a269a514ae1d = function(arg0, arg1) {
        var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 4);
        console.warn(...v0);
    };
    imports.wbg.__wbg_instanceof_Window_acc97ff9f5d2c7b4 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Window;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_document_3ead31dbcad65886 = function(arg0) {
        const ret = getObject(arg0).document;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_outerHeight_be8988c8d37918b4 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).outerHeight;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setTimeout_d6fcf0d9067b8e64 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).setTimeout(getObject(arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_body_3cb4b4042b9a632b = function(arg0) {
        const ret = getObject(arg0).body;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_setonscroll_203d9ee954ddac9b = function(arg0, arg1) {
        getObject(arg0).onscroll = getObject(arg1);
    };
    imports.wbg.__wbg_createElement_976dbb84fe1661b5 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_createElementNS_1561aca8ee3693c0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = getObject(arg0).createElementNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_createTextNode_300f845fab76642f = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).createTextNode(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_querySelector_3628dc2c3319e7e0 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_querySelectorAll_3384c2b9ae37d92f = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).querySelectorAll(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_HtmlDocument_ea501c232ab42442 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof HTMLDocument;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_execCommand_36ea6aa30cdd0e6a = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).execCommand(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_target_bf704b7db7ad1387 = function(arg0) {
        const ret = getObject(arg0).target;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_cancelBubble_8c0bdf21c08f1717 = function(arg0) {
        const ret = getObject(arg0).cancelBubble;
        return ret;
    };
    imports.wbg.__wbg_addEventListener_1fc744729ac6dc27 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3), getObject(arg4));
    }, arguments) };
    imports.wbg.__wbg_parentElement_0cffb3ceb0f107bd = function(arg0) {
        const ret = getObject(arg0).parentElement;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_lastChild_a2f5ed739809bb31 = function(arg0) {
        const ret = getObject(arg0).lastChild;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_setnodeValue_4077cafeefd0725e = function(arg0, arg1, arg2) {
        getObject(arg0).nodeValue = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_appendChild_e513ef0e5098dfdd = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).appendChild(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_insertBefore_9f2d2defb9471006 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).insertBefore(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_removeChild_6751e9ca5d9aaf00 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).removeChild(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_Element_33bd126d58f2021b = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Element;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_namespaceURI_e19c7be2c60e5b5c = function(arg0, arg1) {
        const ret = getObject(arg1).namespaceURI;
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_setclassName_ab2d02663db47af3 = function(arg0, arg1, arg2) {
        getObject(arg0).className = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_getBoundingClientRect_06acb6ac1c23e409 = function(arg0) {
        const ret = getObject(arg0).getBoundingClientRect();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_querySelector_494c823e686113aa = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_removeAttribute_beaed7727852af78 = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).removeAttribute(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_setAttribute_d8436c14a59ab1af = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_instanceof_HtmlElement_eff00d16af7bd6e7 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof HTMLElement;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_style_e9380748cee29f13 = function(arg0) {
        const ret = getObject(arg0).style;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setonclick_361e8684743f7de8 = function(arg0, arg1) {
        getObject(arg0).onclick = getObject(arg1);
    };
    imports.wbg.__wbg_setProperty_e489dfd8c0a6bffc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).setProperty(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_top_af8250f1ed584537 = function(arg0) {
        const ret = getObject(arg0).top;
        return ret;
    };
    imports.wbg.__wbg_value_ccb32485ee1b3928 = function(arg0, arg1) {
        const ret = getObject(arg1).value;
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_setvalue_df64bc6794c098f2 = function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_item_a0fbaf104daa97a1 = function(arg0, arg1) {
        const ret = getObject(arg0).item(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_HtmlInputElement_970e4026de0fccff = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof HTMLInputElement;
        } catch {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_setchecked_f1e1f3e62cdca8e7 = function(arg0, arg1) {
        getObject(arg0).checked = arg1 !== 0;
    };
    imports.wbg.__wbg_value_b2a620d34c663701 = function(arg0, arg1) {
        const ret = getObject(arg1).value;
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_setvalue_e5b519cca37d82a7 = function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_select_55ef42fd50758af6 = function(arg0) {
        getObject(arg0).select();
    };
    imports.wbg.__wbg_newnoargs_b5b063fc6c2f0376 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_get_765201544a2b6869 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_call_97ae9d8645dc388b = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_0b9bfdd97583284e = function() {
        const ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_self_6d479506f72c6a71 = function() { return handleError(function () {
        const ret = self.self;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_window_f2557cc78490aceb = function() { return handleError(function () {
        const ret = window.window;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_globalThis_7f206bda628d5286 = function() { return handleError(function () {
        const ret = globalThis.globalThis;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_global_ba75c50d1cf384f4 = function() { return handleError(function () {
        const ret = global.global;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbg_newwithargs_8fe23e3842840c8e = function(arg0, arg1, arg2, arg3) {
        const ret = new Function(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_valueOf_6b6effad03e5c546 = function(arg0) {
        const ret = getObject(arg0).valueOf();
        return ret;
    };
    imports.wbg.__wbg_is_40a66842732708e7 = function(arg0, arg1) {
        const ret = Object.is(getObject(arg0), getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_set_bf3f89b92d5a34bf = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_closure_wrapper279 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 146, __wbg_adapter_18);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper386 = function(arg0, arg1, arg2) {
        const ret = makeClosure(arg0, arg1, 160, __wbg_adapter_21);
        return addHeapObject(ret);
    };

    return imports;
}

function finalizeInit(instance, module) {
    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;
    cachedFloat64Memory0 = new Float64Array();
    cachedInt32Memory0 = new Int32Array();
    cachedUint32Memory0 = new Uint32Array();
    cachedUint8Memory0 = new Uint8Array();

    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    const imports = getImports();

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return finalizeInit(instance, module);
}

async function init(input) {

    const imports = getImports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    const { instance, module } = await load(await input, imports);

    return finalizeInit(instance, module);
}

var exports = /*#__PURE__*/Object.freeze({
    __proto__: null,
    run: run,
    ScrollState: ScrollState,
    initSync: initSync,
    'default': init
});

var app = async (opt = {}) => {
                let {importHook, serverPath} = opt;

                let path = "js/assets/algorithmssite_page-7774bb35.wasm";

                if (serverPath != null) {
                    path = serverPath + /[^\/\\]*$/.exec(path)[0];
                }

                if (importHook != null) {
                    path = importHook(path);
                }

                await init(path);
                return exports;
            };

var article = ___$insertStyle("body {\n  padding: 0px;\n  margin: 0px;\n  text-align: center;\n  background-color: rgba(228, 228, 228, 0.5);\n}\n\np {\n  font-size: 14px;\n}\n\n.hidden-flow {\n  overflow: hidden;\n}\n\nheader {\n  top: 0;\n  display: flex;\n  position: fixed;\n  align-items: center;\n  align-content: center;\n  justify-content: space-between;\n  background-color: rgba(170, 198, 188, 0.95);\n  width: 100%;\n}\nheader img {\n  margin-left: 5px;\n  width: 100px;\n  height: 50px;\n}\nheader menu-container {\n  list-style: none;\n  padding-inline-start: 0px;\n  margin-inline-start: 0px;\n  display: inline-flex;\n  justify-content: space-between;\n  flex-direction: row;\n  margin-right: 20px;\n  width: 30%;\n}\n\n.centered {\n  margin-right: auto;\n  margin-left: auto;\n  display: block;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: #505050;\n  font-size: 24px;\n  font-family: Ubuntu-Light, Helvetica, sans-serif;\n  text-align: center;\n}\n\n/* ---------------------------------------------- */\n/* Loading animation from https://loading.io/css/ */\n.lds-dual-ring {\n  display: inline-block;\n  width: 24px;\n  height: 24px;\n}\n\n.lds-dual-ring:after {\n  content: \" \";\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin: 0px;\n  border-radius: 50%;\n  border: 3px solid #333;\n  border-color: #333 transparent #333 transparent;\n  animation: lds-dual-ring 1.2s linear infinite;\n}\n\n@keyframes lds-dual-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.custom-button-flat {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.custom-button-flat-select {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.pulse-info:hover {\n  box-shadow: rgb(150, 168, 148) 2px 2px 5px 2px;\n}\n\n.social {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-around;\n  background-color: transparent;\n}\n\naside.contact-us {\n  font-size: 14px;\n  padding-bottom: 10px;\n  text-align: left;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  margin: 10px 20px;\n  background-color: rgba(150, 168, 148, 0.5);\n  border-radius: 0px 0px 10px 10px;\n}\naside.contact-us div {\n  background-color: transparent;\n}\naside.contact-us .title {\n  margin-bottom: 30px;\n  background-color: transparent;\n  text-align: center;\n}\naside.contact-us a {\n  text-decoration: none;\n  color: black;\n}\naside.contact-us a:hover {\n  text-decoration: underline;\n  color: #575757;\n}\n\naside.contact-us img {\n  width: 50px;\n  hight: 50px;\n  margin-left: 10px;\n}\n\nfooter {\n  width: 100%;\n  text-align: center;\n  background-color: rgba(150, 168, 148, 0.5);\n  padding: 10px 0px;\n}\n\n.not-found {\n  margin: 250px 0px 10px 0px;\n  display: flex;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: flex-start;\n  justify-content: space-around;\n  align-items: flex-start;\n}\n.not-found div {\n  width: 50%;\n}\n.not-found div h1 {\n  border-bottom: solid;\n}\n.not-found div p {\n  margin: 0px 0px 250px 0px;\n}\n\nmain {\n  margin-top: 100px;\n}\n\n.empty {\n  margin: 250px 0px 250px 0px;\n}\n\n.article-title {\n  margin-bottom: 50px;\n}\n\n.article-widget {\n  width: 290px;\n  margin: 10px;\n  padding: 10px;\n}\n.article-widget:hover {\n  background-color: rgba(255, 255, 255, 0.2);\n}\n.article-widget .article-widget-short {\n  margin: 5px 0px;\n}\n.article-widget .article-widget-author {\n  text-align: right;\n}");

var donate = ___$insertStyle("body {\n  padding: 0px;\n  margin: 0px;\n  text-align: center;\n  background-color: rgba(228, 228, 228, 0.5);\n}\n\np {\n  font-size: 14px;\n}\n\n.hidden-flow {\n  overflow: hidden;\n}\n\nheader {\n  top: 0;\n  display: flex;\n  position: fixed;\n  align-items: center;\n  align-content: center;\n  justify-content: space-between;\n  background-color: rgba(170, 198, 188, 0.95);\n  width: 100%;\n}\nheader img {\n  margin-left: 5px;\n  width: 100px;\n  height: 50px;\n}\nheader menu-container {\n  list-style: none;\n  padding-inline-start: 0px;\n  margin-inline-start: 0px;\n  display: inline-flex;\n  justify-content: space-between;\n  flex-direction: row;\n  margin-right: 20px;\n  width: 30%;\n}\n\n.centered {\n  margin-right: auto;\n  margin-left: auto;\n  display: block;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: #505050;\n  font-size: 24px;\n  font-family: Ubuntu-Light, Helvetica, sans-serif;\n  text-align: center;\n}\n\n/* ---------------------------------------------- */\n/* Loading animation from https://loading.io/css/ */\n.lds-dual-ring {\n  display: inline-block;\n  width: 24px;\n  height: 24px;\n}\n\n.lds-dual-ring:after {\n  content: \" \";\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin: 0px;\n  border-radius: 50%;\n  border: 3px solid #333;\n  border-color: #333 transparent #333 transparent;\n  animation: lds-dual-ring 1.2s linear infinite;\n}\n\n@keyframes lds-dual-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.custom-button-flat {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.custom-button-flat-select {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.pulse-info:hover {\n  box-shadow: rgb(150, 168, 148) 2px 2px 5px 2px;\n}\n\n.social {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-around;\n  background-color: transparent;\n}\n\naside.contact-us {\n  font-size: 14px;\n  padding-bottom: 10px;\n  text-align: left;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  margin: 10px 20px;\n  background-color: rgba(150, 168, 148, 0.5);\n  border-radius: 0px 0px 10px 10px;\n}\naside.contact-us div {\n  background-color: transparent;\n}\naside.contact-us .title {\n  margin-bottom: 30px;\n  background-color: transparent;\n  text-align: center;\n}\naside.contact-us a {\n  text-decoration: none;\n  color: black;\n}\naside.contact-us a:hover {\n  text-decoration: underline;\n  color: #575757;\n}\n\naside.contact-us img {\n  width: 50px;\n  hight: 50px;\n  margin-left: 10px;\n}\n\nfooter {\n  width: 100%;\n  text-align: center;\n  background-color: rgba(150, 168, 148, 0.5);\n  padding: 10px 0px;\n}\n\n.not-found {\n  margin: 250px 0px 10px 0px;\n  display: flex;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: flex-start;\n  justify-content: space-around;\n  align-items: flex-start;\n}\n.not-found div {\n  width: 50%;\n}\n.not-found div h1 {\n  border-bottom: solid;\n}\n.not-found div p {\n  margin: 0px 0px 250px 0px;\n}\n\n.splain {\n  margin: 100px 80px 50px 80px;\n  text-align: left;\n}\n\nsection {\n  margin: 40px 20px;\n}\n\n#donate-dev {\n  margin-top: 80px;\n  width: 100%;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: center;\n  justify-content: space-evenly;\n  align-items: center;\n  text-align: left;\n  font-size: 14px;\n}\n#donate-dev p {\n  width: 85%;\n}\n\n#wallets-container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-rows: 100px;\n  grid-gap: 50px;\n  justify-content: center;\n  align-items: center;\n  margin: 150px 0px;\n  width: 100%;\n  justify-items: center;\n  align-content: space-around;\n}\n\n.wallet-widget {\n  background-color: rgba(120, 150, 120, 0.09);\n  width: 290px;\n  border-radius: 10px;\n  margin: 10px;\n  padding: 10px;\n}\n\n.wallet-widget .wallet-widget-top {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.wallet-widget img {\n  margin: 5px 0px;\n  width: 100px;\n  height: 100px;\n}\n\n.wallet-widget input {\n  text-align: center;\n  width: 250px;\n  height: 25px;\n  font-family: \"IBM Plex Sans\", sans-serif;\n  font-size: 0.875rem;\n  font-weight: 400;\n  line-height: 1.5;\n  border-radius: 15px 0px;\n  cursor: pointer;\n  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;\n}\n\n.wallet-widget input:focus {\n  color: #596882;\n  background-color: #fff;\n  border-color: #7cb2fe;\n  outline: 0;\n  box-shadow: 0 0 0 0.2rem rgba(1, 104, 250, 0.25);\n}");

var home = ___$insertStyle("body {\n  padding: 0px;\n  margin: 0px;\n  text-align: center;\n  background-color: rgba(228, 228, 228, 0.5);\n}\n\np {\n  font-size: 14px;\n}\n\n.hidden-flow {\n  overflow: hidden;\n}\n\nheader {\n  top: 0;\n  display: flex;\n  position: fixed;\n  align-items: center;\n  align-content: center;\n  justify-content: space-between;\n  background-color: rgba(170, 198, 188, 0.95);\n  width: 100%;\n}\nheader img {\n  margin-left: 5px;\n  width: 100px;\n  height: 50px;\n}\nheader menu-container {\n  list-style: none;\n  padding-inline-start: 0px;\n  margin-inline-start: 0px;\n  display: inline-flex;\n  justify-content: space-between;\n  flex-direction: row;\n  margin-right: 20px;\n  width: 30%;\n}\n\n.centered {\n  margin-right: auto;\n  margin-left: auto;\n  display: block;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: #505050;\n  font-size: 24px;\n  font-family: Ubuntu-Light, Helvetica, sans-serif;\n  text-align: center;\n}\n\n/* ---------------------------------------------- */\n/* Loading animation from https://loading.io/css/ */\n.lds-dual-ring {\n  display: inline-block;\n  width: 24px;\n  height: 24px;\n}\n\n.lds-dual-ring:after {\n  content: \" \";\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin: 0px;\n  border-radius: 50%;\n  border: 3px solid #333;\n  border-color: #333 transparent #333 transparent;\n  animation: lds-dual-ring 1.2s linear infinite;\n}\n\n@keyframes lds-dual-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.custom-button-flat {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.custom-button-flat-select {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.pulse-info:hover {\n  box-shadow: rgb(150, 168, 148) 2px 2px 5px 2px;\n}\n\n.social {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-around;\n  background-color: transparent;\n}\n\naside.contact-us {\n  font-size: 14px;\n  padding-bottom: 10px;\n  text-align: left;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  margin: 10px 20px;\n  background-color: rgba(150, 168, 148, 0.5);\n  border-radius: 0px 0px 10px 10px;\n}\naside.contact-us div {\n  background-color: transparent;\n}\naside.contact-us .title {\n  margin-bottom: 30px;\n  background-color: transparent;\n  text-align: center;\n}\naside.contact-us a {\n  text-decoration: none;\n  color: black;\n}\naside.contact-us a:hover {\n  text-decoration: underline;\n  color: #575757;\n}\n\naside.contact-us img {\n  width: 50px;\n  hight: 50px;\n  margin-left: 10px;\n}\n\nfooter {\n  width: 100%;\n  text-align: center;\n  background-color: rgba(150, 168, 148, 0.5);\n  padding: 10px 0px;\n}\n\n.not-found {\n  margin: 250px 0px 10px 0px;\n  display: flex;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: flex-start;\n  justify-content: space-around;\n  align-items: flex-start;\n}\n.not-found div {\n  width: 50%;\n}\n.not-found div h1 {\n  border-bottom: solid;\n}\n.not-found div p {\n  margin: 0px 0px 250px 0px;\n}\n\n.welcome {\n  width: 100%;\n  padding: 100px 0px 0px 0px;\n  background-image: url(../images/logo.svg);\n  background-size: 500px 250px;\n  background-repeat: no-repeat;\n  background-position: center;\n  background-color: rgba(218, 218, 228, 0.3);\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n}\n\n.info {\n  margin: 40px 0px;\n  display: flex;\n  text-align: center;\n  flex-direction: column;\n  align-content: center;\n  justify-content: space-between;\n  align-items: center;\n}\n.info div {\n  text-align: left;\n  width: 60%;\n}");

var main = {
  app: await app(),
  style: {
    "article": article,
    "donate": donate,
    "home": home,
  },
};

export { main as default };
