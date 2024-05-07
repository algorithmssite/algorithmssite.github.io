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
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

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
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b);
});

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
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}
function __wbg_adapter_20(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3a980ddd0a3860b8(arg0, arg1);
}

function __wbg_adapter_23(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h7aa2b7db1d0b08c1(arg0, arg1, addHeapObject(arg2));
}

let stack_pointer = 128;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}
function __wbg_adapter_26(arg0, arg1, arg2) {
    try {
        wasm._dyn_core__ops__function__FnMut___A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc9ff082ff3c97e63(arg0, arg1, addBorrowedObject(arg2));
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

const ScrollStateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_scrollstate_free(ptr >>> 0));
/**
*/
class ScrollState {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ScrollStateFinalization.unregister(this);
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
    imports.wbg.__wbg_instanceof_Window_f401953a2cf86220 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_document_5100775d18896c16 = function(arg0) {
        const ret = getObject(arg0).document;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_querySelector_a5f74efc5fa193dd = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setclassName_9fee267eae0d8ddc = function(arg0, arg1, arg2) {
        getObject(arg0).className = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_querySelectorAll_4e0fcdb64cda2cd5 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).querySelectorAll(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_item_71aa833e122aa393 = function(arg0, arg1) {
        const ret = getObject(arg0).item(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_Element_6945fc210db80ea9 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Element;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_outerHeight_9bee47d8377f657d = function() { return handleError(function (arg0) {
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
    imports.wbg.__wbg_get_e3c254076557e348 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_HtmlInputElement_307512fe1252c849 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof HTMLInputElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_select_b31447281dd04e67 = function(arg0) {
        getObject(arg0).select();
    };
    imports.wbg.__wbg_value_47fe6384562f52ab = function(arg0, arg1) {
        const ret = getObject(arg1).value;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_instanceof_HtmlDocument_99148bb8629488f7 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof HTMLDocument;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_execCommand_c57046ee133b2517 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).execCommand(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setvalue_78cb4f1fef58ae98 = function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_instanceof_HtmlElement_3bcc4ff70cfdcba5 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof HTMLElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_newnoargs_e258087cd0daa0ea = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setonclick_4fd9bd8531d33a17 = function(arg0, arg1) {
        getObject(arg0).onclick = getObject(arg1);
    };
    imports.wbg.__wbg_setTimeout_c172d5704ef82276 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).setTimeout(getObject(arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithargs_33d0ffcb48344669 = function(arg0, arg1, arg2, arg3) {
        const ret = new Function(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_body_edb1908d3ceff3a1 = function(arg0) {
        const ret = getObject(arg0).body;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_querySelector_4007461b1978a9eb = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_style_c3fc3dd146182a2d = function(arg0) {
        const ret = getObject(arg0).style;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getBoundingClientRect_91e6d57c4e65f745 = function(arg0) {
        const ret = getObject(arg0).getBoundingClientRect();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_top_c4e2234a035a3d25 = function(arg0) {
        const ret = getObject(arg0).top;
        return ret;
    };
    imports.wbg.__wbg_setProperty_ea7d15a2b591aa97 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).setProperty(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_setonscroll_1af87b127c75650e = function(arg0, arg1) {
        getObject(arg0).onscroll = getObject(arg1);
    };
    imports.wbg.__wbg_lastChild_83efe6d5da370e1f = function(arg0) {
        const ret = getObject(arg0).lastChild;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_removeChild_96bbfefd2f5a0261 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).removeChild(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
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
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_self_ce0dbfc45cf2f5be = function() { return handleError(function () {
        const ret = self.self;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_window_c6fb939a7f436783 = function() { return handleError(function () {
        const ret = window.window;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_globalThis_d1e6af4856ba331b = function() { return handleError(function () {
        const ret = globalThis.globalThis;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_global_207b558942527489 = function() { return handleError(function () {
        const ret = global.global;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbg_call_27c0f87801dedf93 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_queueMicrotask_3cbae2ec6b6cd3d6 = function(arg0) {
        const ret = getObject(arg0).queueMicrotask;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'function';
        return ret;
    };
    imports.wbg.__wbg_resolve_b0083a7967828ec8 = function(arg0) {
        const ret = Promise.resolve(getObject(arg0));
        return addHeapObject(ret);
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
    imports.wbg.__wbg_then_0c86a60e8fcfe9f6 = function(arg0, arg1) {
        const ret = getObject(arg0).then(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_queueMicrotask_481971b0d87f3dd4 = function(arg0) {
        queueMicrotask(getObject(arg0));
    };
    imports.wbg.__wbg_is_010fdc0f4ab96916 = function(arg0, arg1) {
        const ret = Object.is(getObject(arg0), getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_nextSibling_709614fdb0fb7a66 = function(arg0) {
        const ret = getObject(arg0).nextSibling;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_insertBefore_d2a001abf538c1f8 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).insertBefore(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setnodeValue_94b86af0cda24b90 = function(arg0, arg1, arg2) {
        getObject(arg0).nodeValue = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_namespaceURI_5235ee79fd5f6781 = function(arg0, arg1) {
        const ret = getObject(arg1).namespaceURI;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_createElement_8bae7856a4bb7411 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_createElementNS_556a62fb298be5a2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = getObject(arg0).createElementNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setchecked_931ff2ed2cd3ebfd = function(arg0, arg1) {
        getObject(arg0).checked = arg1 !== 0;
    };
    imports.wbg.__wbg_setvalue_090972231f0a4f6f = function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_createTextNode_0c38fd80a5b2284d = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).createTextNode(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_appendChild_580ccb11a660db68 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).appendChild(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_error_71d6845bf00a930f = function(arg0, arg1) {
        var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 4, 4);
        console.error(...v0);
    };
    imports.wbg.__wbg_setinnerHTML_26d69b59e1af99c7 = function(arg0, arg1, arg2) {
        getObject(arg0).innerHTML = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_children_8904f20261f6442c = function(arg0) {
        const ret = getObject(arg0).children;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_from_89e3fc3ba5e6fb48 = function(arg0) {
        const ret = Array.from(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_length_cd7af8117672b8b8 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_get_bd8e338fbd5f5cc8 = function(arg0, arg1) {
        const ret = getObject(arg0)[arg1 >>> 0];
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setsubtreeid_d32e6327eef1f7fc = function(arg0, arg1) {
        getObject(arg0).__yew_subtree_id = arg1 >>> 0;
    };
    imports.wbg.__wbg_new_72fb9a18b5ae2624 = function() {
        const ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_1f9b04f170055d33 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_addEventListener_4283b15b4f039eb5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3), getObject(arg4));
    }, arguments) };
    imports.wbg.__wbg_composedPath_58473fd5ae55f2cd = function(arg0) {
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
    imports.wbg.__wbg_bubbles_abce839854481bc6 = function(arg0) {
        const ret = getObject(arg0).bubbles;
        return ret;
    };
    imports.wbg.__wbg_parentElement_347524db59fc2976 = function(arg0) {
        const ret = getObject(arg0).parentElement;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_parentNode_6be3abff20e1a5fb = function(arg0) {
        const ret = getObject(arg0).parentNode;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_ShadowRoot_9db040264422e84a = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof ShadowRoot;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_host_c667c7623404d6bf = function(arg0) {
        const ret = getObject(arg0).host;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setcachekey_80183b7cfc421143 = function(arg0, arg1) {
        getObject(arg0).__yew_subtree_cache_key = arg1 >>> 0;
    };
    imports.wbg.__wbg_cancelBubble_c0aa3172524eb03c = function(arg0) {
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
    imports.wbg.__wbg_setAttribute_3c9f6c303b696daa = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_value_d7f5bfbd9302c14b = function(arg0, arg1) {
        const ret = getObject(arg1).value;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_removeAttribute_1b10a06ae98ebbd1 = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).removeAttribute(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbindgen_closure_wrapper189 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 10, __wbg_adapter_20);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper882 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 10, __wbg_adapter_23);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper1736 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 10, __wbg_adapter_26);
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
    ScrollState: ScrollState,
    default: __wbg_init,
    initSync: initSync,
    run: run
});

const wasm_path = "js/assets/algorithmssite_page-DLw6E0XK.wasm";

            
            var app = async (opt = {}) => {
                let {importHook, serverPath, initializeHook} = opt;

                let final_path = wasm_path;

                if (serverPath != null) {
                    final_path = serverPath + /[^\/\\]*$/.exec(final_path)[0];
                }

                if (importHook != null) {
                    final_path = importHook(final_path);
                }

                if (initializeHook != null) {
                    await initializeHook(__wbg_init, final_path);

                } else {
                    await __wbg_init(final_path);
                }

                return exports;
            };

var article = ___$insertStyle("body {\n  padding: 0px;\n  margin: 0px;\n  text-align: center;\n  background-color: rgba(228, 228, 228, 0.5);\n}\n\np {\n  font-size: 14px;\n}\n\n.hidden-flow {\n  overflow: hidden;\n}\n\nheader {\n  top: 0;\n  display: flex;\n  position: fixed;\n  align-items: center;\n  align-content: center;\n  justify-content: space-between;\n  background-color: rgba(170, 198, 188, 0.95);\n  width: 100%;\n}\nheader img {\n  margin-left: 5px;\n  width: 100px;\n  height: 50px;\n}\nheader menu-container {\n  list-style: none;\n  padding-inline-start: 0px;\n  margin-inline-start: 0px;\n  display: inline-flex;\n  justify-content: space-between;\n  flex-direction: row;\n  margin-right: 20px;\n  width: 30%;\n}\n\n.centered {\n  margin-right: auto;\n  margin-left: auto;\n  display: block;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: #505050;\n  font-size: 24px;\n  font-family: Ubuntu-Light, Helvetica, sans-serif;\n  text-align: center;\n}\n\n/* ---------------------------------------------- */\n/* Loading animation from https://loading.io/css/ */\n.lds-dual-ring {\n  display: inline-block;\n  width: 24px;\n  height: 24px;\n}\n\n.lds-dual-ring:after {\n  content: \" \";\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin: 0px;\n  border-radius: 50%;\n  border: 3px solid #333;\n  border-color: #333 transparent #333 transparent;\n  animation: lds-dual-ring 1.2s linear infinite;\n}\n\n@keyframes lds-dual-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.custom-button-flat {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.custom-button-flat-select {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.pulse-info:hover {\n  box-shadow: rgb(150, 168, 148) 2px 2px 5px 2px;\n}\n\n.social {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-around;\n  background-color: transparent;\n}\n\naside.contact-us {\n  font-size: 12px;\n  padding-bottom: 10px;\n  text-align: left;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  margin: 10px 20px;\n  background-color: rgba(150, 168, 148, 0.5);\n  border-radius: 0px 0px 10px 10px;\n}\naside.contact-us div {\n  background-color: transparent;\n}\naside.contact-us .title {\n  margin-bottom: 30px;\n  background-color: transparent;\n  text-align: center;\n}\naside.contact-us a {\n  text-decoration: none;\n  color: black;\n}\naside.contact-us a:hover {\n  text-decoration: underline;\n  color: #575757;\n}\n\naside.contact-us img {\n  width: 50px;\n  hight: 50px;\n  margin-left: 10px;\n}\n\nfooter {\n  width: 100%;\n  text-align: center;\n  background-color: rgba(150, 168, 148, 0.5);\n  padding: 10px 0px;\n}\n\n.not-found {\n  margin: 250px 0px 10px 0px;\n  display: flex;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: flex-start;\n  justify-content: space-around;\n  align-items: flex-start;\n}\n.not-found div {\n  width: 50%;\n}\n.not-found div h1 {\n  border-bottom: solid;\n}\n.not-found div p {\n  margin: 0px 0px 250px 0px;\n}\n\nmain {\n  margin-top: 100px;\n}\n\n.empty {\n  margin: 250px 0px 250px 0px;\n}\n\n.article-title {\n  margin-bottom: 50px;\n}\n\n.article-widget {\n  width: 290px;\n  margin: 10px;\n  padding: 10px;\n}\n.article-widget:hover {\n  background-color: rgba(255, 255, 255, 0.2);\n}\n.article-widget .article-widget-short {\n  margin: 5px 0px;\n}\n.article-widget .article-widget-author {\n  text-align: right;\n}");

var donate = ___$insertStyle("body {\n  padding: 0px;\n  margin: 0px;\n  text-align: center;\n  background-color: rgba(228, 228, 228, 0.5);\n}\n\np {\n  font-size: 14px;\n}\n\n.hidden-flow {\n  overflow: hidden;\n}\n\nheader {\n  top: 0;\n  display: flex;\n  position: fixed;\n  align-items: center;\n  align-content: center;\n  justify-content: space-between;\n  background-color: rgba(170, 198, 188, 0.95);\n  width: 100%;\n}\nheader img {\n  margin-left: 5px;\n  width: 100px;\n  height: 50px;\n}\nheader menu-container {\n  list-style: none;\n  padding-inline-start: 0px;\n  margin-inline-start: 0px;\n  display: inline-flex;\n  justify-content: space-between;\n  flex-direction: row;\n  margin-right: 20px;\n  width: 30%;\n}\n\n.centered {\n  margin-right: auto;\n  margin-left: auto;\n  display: block;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: #505050;\n  font-size: 24px;\n  font-family: Ubuntu-Light, Helvetica, sans-serif;\n  text-align: center;\n}\n\n/* ---------------------------------------------- */\n/* Loading animation from https://loading.io/css/ */\n.lds-dual-ring {\n  display: inline-block;\n  width: 24px;\n  height: 24px;\n}\n\n.lds-dual-ring:after {\n  content: \" \";\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin: 0px;\n  border-radius: 50%;\n  border: 3px solid #333;\n  border-color: #333 transparent #333 transparent;\n  animation: lds-dual-ring 1.2s linear infinite;\n}\n\n@keyframes lds-dual-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.custom-button-flat {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.custom-button-flat-select {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.pulse-info:hover {\n  box-shadow: rgb(150, 168, 148) 2px 2px 5px 2px;\n}\n\n.social {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-around;\n  background-color: transparent;\n}\n\naside.contact-us {\n  font-size: 12px;\n  padding-bottom: 10px;\n  text-align: left;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  margin: 10px 20px;\n  background-color: rgba(150, 168, 148, 0.5);\n  border-radius: 0px 0px 10px 10px;\n}\naside.contact-us div {\n  background-color: transparent;\n}\naside.contact-us .title {\n  margin-bottom: 30px;\n  background-color: transparent;\n  text-align: center;\n}\naside.contact-us a {\n  text-decoration: none;\n  color: black;\n}\naside.contact-us a:hover {\n  text-decoration: underline;\n  color: #575757;\n}\n\naside.contact-us img {\n  width: 50px;\n  hight: 50px;\n  margin-left: 10px;\n}\n\nfooter {\n  width: 100%;\n  text-align: center;\n  background-color: rgba(150, 168, 148, 0.5);\n  padding: 10px 0px;\n}\n\n.not-found {\n  margin: 250px 0px 10px 0px;\n  display: flex;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: flex-start;\n  justify-content: space-around;\n  align-items: flex-start;\n}\n.not-found div {\n  width: 50%;\n}\n.not-found div h1 {\n  border-bottom: solid;\n}\n.not-found div p {\n  margin: 0px 0px 250px 0px;\n}\n\n.splain {\n  margin: 100px 80px 50px 80px;\n  text-align: left;\n}\n\nsection {\n  margin: 40px 20px;\n}\n\n#donate-dev {\n  margin-top: 80px;\n  width: 100%;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: center;\n  justify-content: space-evenly;\n  align-items: center;\n  text-align: left;\n  font-size: 14px;\n}\n#donate-dev p {\n  width: 85%;\n}\n\n#wallets-container {\n  display: grid;\n  grid-gap: 10px;\n  justify-content: center;\n  align-items: center;\n  margin: 150px 0px;\n  width: 100%;\n  justify-items: center;\n  align-content: space-around;\n  grid-template-columns: repeat(1, 3fr);\n}\n\n@media (min-width: 768px) {\n  #wallets-container {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}\n.wallet-widget {\n  background-color: rgba(120, 150, 120, 0.09);\n  width: 290px;\n  border-radius: 10px;\n  margin: 10px;\n  padding: 10px;\n}\n\n.wallet-widget .wallet-widget-top {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.wallet-widget img {\n  margin: 5px 0px;\n  width: 100px;\n  height: 100px;\n}\n\n.wallet-widget input {\n  text-align: center;\n  width: 250px;\n  height: 25px;\n  font-family: \"IBM Plex Sans\", sans-serif;\n  font-size: 0.875rem;\n  font-weight: 400;\n  line-height: 1.5;\n  border-radius: 15px 0px;\n  cursor: pointer;\n  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;\n}\n\n.wallet-widget input:focus {\n  color: #596882;\n  background-color: #fff;\n  border-color: #7cb2fe;\n  outline: 0;\n  box-shadow: 0 0 0 0.2rem rgba(1, 104, 250, 0.25);\n}");

var home = ___$insertStyle("body {\n  padding: 0px;\n  margin: 0px;\n  text-align: center;\n  background-color: rgba(228, 228, 228, 0.5);\n}\n\np {\n  font-size: 14px;\n}\n\n.hidden-flow {\n  overflow: hidden;\n}\n\nheader {\n  top: 0;\n  display: flex;\n  position: fixed;\n  align-items: center;\n  align-content: center;\n  justify-content: space-between;\n  background-color: rgba(170, 198, 188, 0.95);\n  width: 100%;\n}\nheader img {\n  margin-left: 5px;\n  width: 100px;\n  height: 50px;\n}\nheader menu-container {\n  list-style: none;\n  padding-inline-start: 0px;\n  margin-inline-start: 0px;\n  display: inline-flex;\n  justify-content: space-between;\n  flex-direction: row;\n  margin-right: 20px;\n  width: 30%;\n}\n\n.centered {\n  margin-right: auto;\n  margin-left: auto;\n  display: block;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: #505050;\n  font-size: 24px;\n  font-family: Ubuntu-Light, Helvetica, sans-serif;\n  text-align: center;\n}\n\n/* ---------------------------------------------- */\n/* Loading animation from https://loading.io/css/ */\n.lds-dual-ring {\n  display: inline-block;\n  width: 24px;\n  height: 24px;\n}\n\n.lds-dual-ring:after {\n  content: \" \";\n  display: block;\n  width: 24px;\n  height: 24px;\n  margin: 0px;\n  border-radius: 50%;\n  border: 3px solid #333;\n  border-color: #333 transparent #333 transparent;\n  animation: lds-dual-ring 1.2s linear infinite;\n}\n\n@keyframes lds-dual-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.custom-button-flat {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: none;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.custom-button-flat-select {\n  font-family: \"Open Sans\", Helvetica, Arial, sans-serif;\n  text-align: center;\n  font-size: 12px;\n  line-height: 12px;\n  outline: none;\n  border-radius: 48px;\n  cursor: pointer;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  transition: background-color 0.1s, box-shadow 0.1s, border 0.1s;\n  text-decoration: none;\n  color: black;\n  border: none;\n  background-color: rgba(248, 248, 248, 0.5);\n  padding: 8px 14px;\n  display: inline-block;\n  margin-right: 20px;\n}\n\n.pulse-info:hover {\n  box-shadow: rgb(150, 168, 148) 2px 2px 5px 2px;\n}\n\n.social {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-around;\n  background-color: transparent;\n}\n\naside.contact-us {\n  font-size: 12px;\n  padding-bottom: 10px;\n  text-align: left;\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n  margin: 10px 20px;\n  background-color: rgba(150, 168, 148, 0.5);\n  border-radius: 0px 0px 10px 10px;\n}\naside.contact-us div {\n  background-color: transparent;\n}\naside.contact-us .title {\n  margin-bottom: 30px;\n  background-color: transparent;\n  text-align: center;\n}\naside.contact-us a {\n  text-decoration: none;\n  color: black;\n}\naside.contact-us a:hover {\n  text-decoration: underline;\n  color: #575757;\n}\n\naside.contact-us img {\n  width: 50px;\n  hight: 50px;\n  margin-left: 10px;\n}\n\nfooter {\n  width: 100%;\n  text-align: center;\n  background-color: rgba(150, 168, 148, 0.5);\n  padding: 10px 0px;\n}\n\n.not-found {\n  margin: 250px 0px 10px 0px;\n  display: flex;\n  display: flex;\n  flex-direction: row;\n  flex-wrap: nowrap;\n  align-content: flex-start;\n  justify-content: space-around;\n  align-items: flex-start;\n}\n.not-found div {\n  width: 50%;\n}\n.not-found div h1 {\n  border-bottom: solid;\n}\n.not-found div p {\n  margin: 0px 0px 250px 0px;\n}\n\n.welcome {\n  width: 100%;\n  padding: 100px 0px 0px 0px;\n  background-image: url(../images/logo.svg);\n  background-size: 500px 250px;\n  background-repeat: no-repeat;\n  background-position: center;\n  background-color: rgba(218, 218, 228, 0.3);\n  box-shadow: rgb(120, 148, 138) 2px 2px 5px 2px;\n}\n\n.info {\n  margin: 40px 0px;\n  display: flex;\n  text-align: center;\n  flex-direction: column;\n  align-content: center;\n  justify-content: space-between;\n  align-items: center;\n}\n.info div {\n  text-align: left;\n  width: 60%;\n}");

var index = {
  app: await app(),
  style: {
    "article": article,
    "donate": donate,
    "home": home,
  },
};

export { index as default };
