
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.14.1 */

    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let header;
    	let div0;
    	let h1;
    	let t1;
    	let hr;
    	let t2;
    	let a0;
    	let i0;
    	let t3;
    	let span0;
    	let t5;
    	let a1;
    	let i1;
    	let t6;
    	let span1;
    	let t8;
    	let div1;
    	let p0;
    	let b0;
    	let t10;
    	let small0;
    	let t12;
    	let main;
    	let h20;
    	let t14;
    	let section0;
    	let h30;
    	let t16;
    	let blockquote;
    	let t18;
    	let p1;
    	let t19;
    	let small1;
    	let t21;
    	let b1;
    	let t23;
    	let t24;
    	let p2;
    	let t26;
    	let small2;
    	let t28;
    	let pre0;
    	let t29;
    	let code0;
    	let t31;
    	let code1;
    	let t33;
    	let small3;
    	let t35;
    	let pre1;
    	let t36;
    	let code2;
    	let t38;
    	let code3;
    	let t40;
    	let small4;
    	let t41;
    	let em;
    	let t43;
    	let t44;
    	let pre2;
    	let t45;
    	let code4;
    	let t47;
    	let code5;
    	let t49;
    	let code6;
    	let t51;
    	let code8;
    	let t52;
    	let code7;
    	let t54;
    	let t55;
    	let code9;
    	let t57;
    	let code11;
    	let t58;
    	let code10;
    	let t60;
    	let t61;
    	let code12;
    	let t63;
    	let t64;
    	let h21;
    	let a2;
    	let t65;
    	let i2;
    	let t66;
    	let section1;
    	let pre3;
    	let t68;
    	let h22;
    	let t70;
    	let section2;
    	let table0;
    	let tr0;
    	let th0;
    	let t72;
    	let th1;
    	let t74;
    	let tr1;
    	let td0;
    	let t76;
    	let td1;
    	let t77;
    	let small5;
    	let t79;
    	let tr2;
    	let td2;
    	let t81;
    	let td3;
    	let t82;
    	let small6;
    	let t84;
    	let tr3;
    	let td4;
    	let t86;
    	let td5;
    	let t87;
    	let small7;
    	let t89;
    	let h23;
    	let t91;
    	let section3;
    	let h31;
    	let t93;
    	let table1;
    	let tr4;
    	let th2;
    	let t95;
    	let th3;
    	let t97;
    	let tr5;
    	let td6;
    	let code13;
    	let t99;
    	let td7;
    	let t100;
    	let small8;
    	let t102;
    	let tr6;
    	let td8;
    	let code14;
    	let t104;
    	let td9;
    	let t105;
    	let small9;
    	let t107;
    	let tr7;
    	let td10;
    	let code15;
    	let t109;
    	let td11;
    	let t110;
    	let small10;
    	let t112;
    	let small11;
    	let t114;
    	let h32;
    	let t116;
    	let table2;
    	let tr8;
    	let th4;
    	let t118;
    	let th5;
    	let t120;
    	let th6;
    	let t122;
    	let th7;
    	let t124;
    	let tr9;
    	let td12;
    	let code16;
    	let t126;
    	let td13;
    	let t127;
    	let small12;
    	let t129;
    	let td14;
    	let t131;
    	let td15;
    	let a3;
    	let t133;
    	let a4;
    	let t135;
    	let tr10;
    	let td16;
    	let code17;
    	let t137;
    	let td17;
    	let t138;
    	let small13;
    	let t140;
    	let td18;
    	let t142;
    	let td19;
    	let a5;
    	let t144;
    	let a6;
    	let t146;
    	let h33;
    	let t148;
    	let table3;
    	let tr11;
    	let th8;
    	let t150;
    	let th9;
    	let t152;
    	let th10;
    	let t154;
    	let th11;
    	let t156;
    	let tr12;
    	let td20;
    	let code18;
    	let t158;
    	let td21;
    	let t159;
    	let small14;
    	let t161;
    	let td22;
    	let t163;
    	let td23;
    	let a7;
    	let t165;
    	let h34;
    	let t167;
    	let table4;
    	let tr13;
    	let th12;
    	let t169;
    	let th13;
    	let t171;
    	let th14;
    	let t173;
    	let th15;
    	let t175;
    	let tr14;
    	let td24;
    	let t177;
    	let td25;
    	let t178;
    	let small15;
    	let t180;
    	let td26;
    	let t181;
    	let small16;
    	let t183;
    	let td27;
    	let a8;
    	let t185;
    	let a9;
    	let t187;
    	let a10;
    	let t189;
    	let a11;
    	let t191;
    	let h35;
    	let t193;
    	let table5;
    	let tr15;
    	let th16;
    	let t195;
    	let th17;
    	let t197;
    	let th18;
    	let t199;
    	let tr16;
    	let td28;
    	let t201;
    	let td29;
    	let a12;
    	let t203;
    	let td30;
    	let t205;
    	let tr17;
    	let td31;
    	let t207;
    	let td32;
    	let a13;
    	let t209;
    	let td33;
    	let t211;
    	let h24;
    	let t213;
    	let section4;
    	let ul;
    	let li;
    	let a14;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Imager";
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			a0 = element("a");
    			i0 = element("i");
    			t3 = space();
    			span0 = element("span");
    			span0.textContent = "GitHub Organization";
    			t5 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t6 = space();
    			span1 = element("span");
    			span1.textContent = "hello@colbyn.com";
    			t8 = space();
    			div1 = element("div");
    			p0 = element("p");
    			b0 = element("b");
    			b0.textContent = "Site performance tools for efficiently distributing media on the web.";
    			t10 = space();
    			small0 = element("small");
    			small0.textContent = "Everything is free and open source, with absolutely no SAAS lock-ins or vendors.";
    			t12 = space();
    			main = element("main");
    			h20 = element("h2");
    			h20.textContent = "Features";
    			t14 = space();
    			section0 = element("section");
    			h30 = element("h3");
    			h30.textContent = "Brute Force Image Optimization";
    			t16 = space();
    			blockquote = element("blockquote");
    			blockquote.textContent = "Optimizes the compression using ML based metrics in a trial ’n error sorta manner.";
    			t18 = space();
    			p1 = element("p");
    			t19 = text("This is a tool that can competitively optimize ");
    			small1 = element("small");
    			small1.textContent = "(e.g.)";
    			t21 = space();
    			b1 = element("b");
    			b1.textContent = "extremely noisy, high resolution images";
    			t23 = text("; at the expense of increased encoding time and CPU overhead. This is a tradeoff that should be suitable for over 90% of online content, where site performance matters.");
    			t24 = space();
    			p2 = element("p");
    			p2.textContent = "It's pretty easy too.";
    			t26 = space();
    			small2 = element("small");
    			small2.textContent = "Using the CLI interface:";
    			t28 = space();
    			pre0 = element("pre");
    			t29 = text("$ imager -i ");
    			code0 = element("code");
    			code0.textContent = "path/to/input/images/*.jpeg";
    			t31 = text(" -o ");
    			code1 = element("code");
    			code1.textContent = "output/";
    			t33 = space();
    			small3 = element("small");
    			small3.textContent = "Using the HTTP server:";
    			t35 = space();
    			pre1 = element("pre");
    			t36 = text("$ imager-server --address 127.0.0.1:3000\n$ http 127.0.0.1:3000/opt < ");
    			code2 = element("code");
    			code2.textContent = "path/to/input/image.jpeg";
    			t38 = text(" > ");
    			code3 = element("code");
    			code3.textContent = "path/to/output/image.jpeg";
    			t40 = space();
    			small4 = element("small");
    			t41 = text("Using the JavaScript ");
    			em = element("em");
    			em.textContent = "non-blocking";
    			t43 = text(" API:");
    			t44 = space();
    			pre2 = element("pre");
    			t45 = text("const {");
    			code4 = element("code");
    			code4.textContent = "ImageBuffer";
    			t47 = text("} = require(");
    			code5 = element("code");
    			code5.textContent = "\"imager-io\"";
    			t49 = text(");\n");
    			code6 = element("code");
    			code6.textContent = "ImageBuffer";
    			t51 = text("\n\t");
    			code8 = element("code");
    			t52 = text(".open(");
    			code7 = element("code");
    			code7.textContent = "\"source-image.jpeg\"";
    			t54 = text(")");
    			t55 = text("\n\t.then(buffer => ");
    			code9 = element("code");
    			code9.textContent = "buffer.opt()";
    			t57 = text(")\n\t.then(buffer => ");
    			code11 = element("code");
    			t58 = text("buffer.save(");
    			code10 = element("code");
    			code10.textContent = "\"result.jpeg\"";
    			t60 = text(")");
    			t61 = text(")\n\t.then(() => console.log(");
    			code12 = element("code");
    			code12.textContent = "\"done\"";
    			t63 = text("));");
    			t64 = space();
    			h21 = element("h2");
    			a2 = element("a");
    			t65 = text("Compression Benchmarks ");
    			i2 = element("i");
    			t66 = space();
    			section1 = element("section");
    			pre3 = element("pre");
    			pre3.textContent = "source        : ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 39.00M (4 images)\nkraken.io     : ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 24M\njpegmini.com  : ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 16M\ncompression.ai: ▇▇▇▇▇▇▇▇ 8.90M\nimager        : ▇▇▇▇ 4.20M";
    			t68 = space();
    			h22 = element("h2");
    			h22.textContent = "Supported Image Optimization Formats";
    			t70 = space();
    			section2 = element("section");
    			table0 = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Format";
    			t72 = space();
    			th1 = element("th");
    			th1.textContent = "Status";
    			t74 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "JPEG";
    			t76 = space();
    			td1 = element("td");
    			t77 = text("✅");
    			small5 = element("small");
    			small5.textContent = "GOOD";
    			t79 = space();
    			tr2 = element("tr");
    			td2 = element("td");
    			td2.textContent = "WebP";
    			t81 = space();
    			td3 = element("td");
    			t82 = text("✅");
    			small6 = element("small");
    			small6.textContent = "EXPERIMENTAL";
    			t84 = space();
    			tr3 = element("tr");
    			td4 = element("td");
    			td4.textContent = "PNG";
    			t86 = space();
    			td5 = element("td");
    			t87 = text("❎");
    			small7 = element("small");
    			small7.textContent = "EXPERIMENTAL";
    			t89 = space();
    			h23 = element("h2");
    			h23.textContent = "Ecosystem";
    			t91 = space();
    			section3 = element("section");
    			h31 = element("h3");
    			h31.textContent = "Operating Systems";
    			t93 = space();
    			table1 = element("table");
    			tr4 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Name";
    			t95 = space();
    			th3 = element("th");
    			th3.textContent = "Status";
    			t97 = space();
    			tr5 = element("tr");
    			td6 = element("td");
    			code13 = element("code");
    			code13.textContent = "Linux";
    			t99 = space();
    			td7 = element("td");
    			t100 = text("✅");
    			small8 = element("small");
    			small8.textContent = "GOOD";
    			t102 = space();
    			tr6 = element("tr");
    			td8 = element("td");
    			code14 = element("code");
    			code14.textContent = "MacOS";
    			t104 = space();
    			td9 = element("td");
    			t105 = text("✅");
    			small9 = element("small");
    			small9.textContent = "GOOD";
    			t107 = space();
    			tr7 = element("tr");
    			td10 = element("td");
    			code15 = element("code");
    			code15.textContent = "Windows";
    			t109 = space();
    			td11 = element("td");
    			t110 = text("❌");
    			small10 = element("small");
    			small10.textContent = "UNPRIORITIZED";
    			t112 = space();
    			small11 = element("small");
    			small11.textContent = "(Use WSL)";
    			t114 = space();
    			h32 = element("h3");
    			h32.textContent = "Command Line Tools";
    			t116 = space();
    			table2 = element("table");
    			tr8 = element("tr");
    			th4 = element("th");
    			th4.textContent = "Name";
    			t118 = space();
    			th5 = element("th");
    			th5.textContent = "Status";
    			t120 = space();
    			th6 = element("th");
    			th6.textContent = "Description";
    			t122 = space();
    			th7 = element("th");
    			th7.textContent = "Links";
    			t124 = space();
    			tr9 = element("tr");
    			td12 = element("td");
    			code16 = element("code");
    			code16.textContent = "imager";
    			t126 = space();
    			td13 = element("td");
    			t127 = text("✅");
    			small12 = element("small");
    			small12.textContent = "GOOD";
    			t129 = space();
    			td14 = element("td");
    			td14.textContent = "The Imager CLI Interface";
    			t131 = space();
    			td15 = element("td");
    			a3 = element("a");
    			a3.textContent = "Source";
    			t133 = text("\n\t\t\t\t\t·\n\t\t\t\t\t");
    			a4 = element("a");
    			a4.textContent = "Documentation";
    			t135 = space();
    			tr10 = element("tr");
    			td16 = element("td");
    			code17 = element("code");
    			code17.textContent = "imager-server";
    			t137 = space();
    			td17 = element("td");
    			t138 = text("✅");
    			small13 = element("small");
    			small13.textContent = "GOOD";
    			t140 = space();
    			td18 = element("td");
    			td18.textContent = "The Imager Server Interface";
    			t142 = space();
    			td19 = element("td");
    			a5 = element("a");
    			a5.textContent = "Source";
    			t144 = text("\n\t\t\t\t\t·\n\t\t\t\t\t");
    			a6 = element("a");
    			a6.textContent = "Documentation";
    			t146 = space();
    			h33 = element("h3");
    			h33.textContent = "Development Tools";
    			t148 = space();
    			table3 = element("table");
    			tr11 = element("tr");
    			th8 = element("th");
    			th8.textContent = "Name";
    			t150 = space();
    			th9 = element("th");
    			th9.textContent = "Status";
    			t152 = space();
    			th10 = element("th");
    			th10.textContent = "Description";
    			t154 = space();
    			th11 = element("th");
    			th11.textContent = "Links";
    			t156 = space();
    			tr12 = element("tr");
    			td20 = element("td");
    			code18 = element("code");
    			code18.textContent = "WebPack";
    			t158 = space();
    			td21 = element("td");
    			t159 = text("❎");
    			small14 = element("small");
    			small14.textContent = "UNOFFICIAL";
    			t161 = space();
    			td22 = element("td");
    			td22.textContent = "Using Vanilla Webpack";
    			t163 = space();
    			td23 = element("td");
    			a7 = element("a");
    			a7.textContent = "Example";
    			t165 = space();
    			h34 = element("h3");
    			h34.textContent = "Languages";
    			t167 = space();
    			table4 = element("table");
    			tr13 = element("tr");
    			th12 = element("th");
    			th12.textContent = "Name";
    			t169 = space();
    			th13 = element("th");
    			th13.textContent = "Status";
    			t171 = space();
    			th14 = element("th");
    			th14.textContent = "Self Contained";
    			t173 = space();
    			th15 = element("th");
    			th15.textContent = "Links";
    			t175 = space();
    			tr14 = element("tr");
    			td24 = element("td");
    			td24.textContent = "NodeJS";
    			t177 = space();
    			td25 = element("td");
    			t178 = text("✅");
    			small15 = element("small");
    			small15.textContent = "GOOD";
    			t180 = space();
    			td26 = element("td");
    			t181 = text("✅");
    			small16 = element("small");
    			small16.textContent = "YES";
    			t183 = space();
    			td27 = element("td");
    			a8 = element("a");
    			a8.textContent = "Source";
    			t185 = text("\n\t\t\t\t\t·\n\t\t\t\t\t");
    			a9 = element("a");
    			a9.textContent = "Documentation";
    			t187 = text("\n\t\t\t\t\t·\n\t\t\t\t\t");
    			a10 = element("a");
    			a10.textContent = "Example";
    			t189 = text("\n\t\t\t\t\t·\n\t\t\t\t\t");
    			a11 = element("a");
    			a11.textContent = "NPM";
    			t191 = space();
    			h35 = element("h3");
    			h35.textContent = "Low-Level Libraries";
    			t193 = space();
    			table5 = element("table");
    			tr15 = element("tr");
    			th16 = element("th");
    			th16.textContent = "Name";
    			t195 = space();
    			th17 = element("th");
    			th17.textContent = "Source";
    			t197 = space();
    			th18 = element("th");
    			th18.textContent = "Description";
    			t199 = space();
    			tr16 = element("tr");
    			td28 = element("td");
    			td28.textContent = "imager-core";
    			t201 = space();
    			td29 = element("td");
    			a12 = element("a");
    			a12.textContent = "GitHub";
    			t203 = space();
    			td30 = element("td");
    			td30.textContent = "Imager AV Toolkit and Essential Codecs";
    			t205 = space();
    			tr17 = element("tr");
    			td31 = element("td");
    			td31.textContent = "imager-advanced";
    			t207 = space();
    			td32 = element("td");
    			a13 = element("a");
    			a13.textContent = "GitHub";
    			t209 = space();
    			td33 = element("td");
    			td33.textContent = "Newer, Better Image Codecs";
    			t211 = space();
    			h24 = element("h2");
    			h24.textContent = "Articles";
    			t213 = space();
    			section4 = element("section");
    			ul = element("ul");
    			li = element("li");
    			a14 = element("a");
    			a14.textContent = "Modern Image Optimization for 2020 - Issues, Solutions, and Open Source Solutions";
    			attr_dev(h1, "class", "svelte-blc2cs");
    			add_location(h1, file, 142, 2, 2287);
    			attr_dev(hr, "class", "svelte-blc2cs");
    			add_location(hr, file, 143, 2, 2305);
    			attr_dev(i0, "class", "fab fa-github svelte-blc2cs");
    			add_location(i0, file, 145, 3, 2355);
    			attr_dev(span0, "class", "svelte-blc2cs");
    			add_location(span0, file, 146, 3, 2388);
    			attr_dev(a0, "href", "https://github.com/imager-io");
    			attr_dev(a0, "class", "svelte-blc2cs");
    			add_location(a0, file, 144, 2, 2312);
    			attr_dev(i1, "class", "fas fa-envelope svelte-blc2cs");
    			add_location(i1, file, 149, 3, 2469);
    			attr_dev(span1, "class", "svelte-blc2cs");
    			add_location(span1, file, 150, 3, 2504);
    			attr_dev(a1, "href", "mailto: hello@colbyn.com");
    			attr_dev(a1, "class", "svelte-blc2cs");
    			add_location(a1, file, 148, 2, 2430);
    			attr_dev(div0, "class", "banner svelte-blc2cs");
    			add_location(div0, file, 141, 1, 2264);
    			add_location(b0, file, 154, 5, 2561);
    			add_location(small0, file, 154, 82, 2638);
    			attr_dev(p0, "class", "svelte-blc2cs");
    			add_location(p0, file, 154, 2, 2558);
    			add_location(div1, file, 153, 1, 2550);
    			attr_dev(header, "class", "top svelte-blc2cs");
    			add_location(header, file, 140, 0, 2242);
    			attr_dev(h20, "class", "svelte-blc2cs");
    			add_location(h20, file, 159, 1, 2765);
    			attr_dev(h30, "class", "svelte-blc2cs");
    			add_location(h30, file, 161, 2, 2796);
    			attr_dev(blockquote, "class", "svelte-blc2cs");
    			add_location(blockquote, file, 162, 2, 2838);
    			add_location(small1, file, 163, 52, 2998);
    			add_location(b1, file, 163, 74, 3020);
    			attr_dev(p1, "class", "svelte-blc2cs");
    			add_location(p1, file, 163, 2, 2948);
    			attr_dev(p2, "class", "svelte-blc2cs");
    			add_location(p2, file, 164, 2, 3241);
    			attr_dev(small2, "class", "svelte-blc2cs");
    			add_location(small2, file, 166, 2, 3275);
    			attr_dev(code0, "path", "");
    			attr_dev(code0, "class", "svelte-blc2cs");
    			add_location(code0, file, 168, 12, 3340);
    			attr_dev(code1, "path", "");
    			attr_dev(code1, "class", "svelte-blc2cs");
    			add_location(code1, file, 168, 61, 3389);
    			attr_dev(pre0, "code", "");
    			attr_dev(pre0, "class", "svelte-blc2cs");
    			add_location(pre0, file, 167, 2, 3317);
    			attr_dev(small3, "class", "svelte-blc2cs");
    			add_location(small3, file, 170, 2, 3426);
    			attr_dev(code2, "path", "");
    			attr_dev(code2, "class", "svelte-blc2cs");
    			add_location(code2, file, 173, 30, 3548);
    			attr_dev(code3, "path", "");
    			attr_dev(code3, "class", "svelte-blc2cs");
    			add_location(code3, file, 173, 77, 3595);
    			attr_dev(pre1, "code", "");
    			attr_dev(pre1, "class", "svelte-blc2cs");
    			add_location(pre1, file, 171, 2, 3466);
    			add_location(em, file, 175, 30, 3678);
    			attr_dev(small4, "class", "svelte-blc2cs");
    			add_location(small4, file, 175, 2, 3650);
    			attr_dev(code4, "highlight", "");
    			attr_dev(code4, "class", "svelte-blc2cs");
    			add_location(code4, file, 177, 12, 3738);
    			attr_dev(code5, "string", "");
    			attr_dev(code5, "class", "svelte-blc2cs");
    			add_location(code5, file, 177, 63, 3789);
    			attr_dev(code6, "highlight", "");
    			attr_dev(code6, "class", "svelte-blc2cs");
    			add_location(code6, file, 178, 0, 3823);
    			attr_dev(code7, "string", "");
    			attr_dev(code7, "class", "svelte-blc2cs");
    			add_location(code7, file, 179, 23, 3881);
    			attr_dev(code8, "highlight", "");
    			attr_dev(code8, "class", "svelte-blc2cs");
    			add_location(code8, file, 179, 1, 3859);
    			attr_dev(code9, "highlight", "");
    			attr_dev(code9, "class", "svelte-blc2cs");
    			add_location(code9, file, 180, 17, 3946);
    			attr_dev(code10, "string", "");
    			attr_dev(code10, "class", "svelte-blc2cs");
    			add_location(code10, file, 181, 45, 4028);
    			attr_dev(code11, "highlight", "");
    			attr_dev(code11, "class", "svelte-blc2cs");
    			add_location(code11, file, 181, 17, 4000);
    			attr_dev(code12, "string", "");
    			attr_dev(code12, "class", "svelte-blc2cs");
    			add_location(code12, file, 182, 25, 4096);
    			attr_dev(pre2, "code", "");
    			attr_dev(pre2, "class", "svelte-blc2cs");
    			add_location(pre2, file, 176, 2, 3715);
    			attr_dev(section0, "class", "svelte-blc2cs");
    			add_location(section0, file, 160, 1, 2784);
    			set_style(i2, "font-size", "18px");
    			attr_dev(i2, "class", "fas fa-external-link-alt");
    			add_location(i2, file, 186, 87, 4235);
    			attr_dev(a2, "href", "https://github.com/colbyn/imager-bench-2019-11-2");
    			attr_dev(a2, "class", "svelte-blc2cs");
    			add_location(a2, file, 186, 5, 4153);
    			attr_dev(h21, "class", "svelte-blc2cs");
    			add_location(h21, file, 186, 1, 4149);
    			attr_dev(pre3, "class", "svelte-blc2cs");
    			add_location(pre3, file, 188, 2, 4323);
    			attr_dev(section1, "class", "svelte-blc2cs");
    			add_location(section1, file, 187, 1, 4311);
    			attr_dev(h22, "class", "svelte-blc2cs");
    			add_location(h22, file, 197, 1, 4566);
    			attr_dev(th0, "class", "svelte-blc2cs");
    			add_location(th0, file, 201, 4, 4645);
    			attr_dev(th1, "class", "svelte-blc2cs");
    			add_location(th1, file, 202, 4, 4665);
    			add_location(tr0, file, 200, 3, 4636);
    			attr_dev(td0, "class", "svelte-blc2cs");
    			add_location(td0, file, 205, 4, 4702);
    			add_location(small5, file, 206, 9, 4725);
    			attr_dev(td1, "class", "svelte-blc2cs");
    			add_location(td1, file, 206, 4, 4720);
    			add_location(tr1, file, 204, 3, 4693);
    			attr_dev(td2, "class", "svelte-blc2cs");
    			add_location(td2, file, 209, 4, 4771);
    			add_location(small6, file, 210, 9, 4794);
    			attr_dev(td3, "class", "svelte-blc2cs");
    			add_location(td3, file, 210, 4, 4789);
    			add_location(tr2, file, 208, 3, 4762);
    			attr_dev(td4, "class", "svelte-blc2cs");
    			add_location(td4, file, 213, 4, 4848);
    			add_location(small7, file, 214, 9, 4870);
    			attr_dev(td5, "class", "svelte-blc2cs");
    			add_location(td5, file, 214, 4, 4865);
    			add_location(tr3, file, 212, 3, 4839);
    			attr_dev(table0, "class", "svelte-blc2cs");
    			add_location(table0, file, 199, 2, 4625);
    			attr_dev(section2, "class", "svelte-blc2cs");
    			add_location(section2, file, 198, 1, 4613);
    			attr_dev(h23, "class", "svelte-blc2cs");
    			add_location(h23, file, 219, 1, 4937);
    			attr_dev(h31, "class", "svelte-blc2cs");
    			add_location(h31, file, 221, 2, 4969);
    			attr_dev(th2, "class", "svelte-blc2cs");
    			add_location(th2, file, 224, 4, 5018);
    			attr_dev(th3, "class", "svelte-blc2cs");
    			add_location(th3, file, 225, 4, 5036);
    			add_location(tr4, file, 223, 3, 5009);
    			add_location(code13, file, 228, 8, 5077);
    			attr_dev(td6, "class", "svelte-blc2cs");
    			add_location(td6, file, 228, 4, 5073);
    			add_location(small8, file, 229, 9, 5110);
    			attr_dev(td7, "class", "svelte-blc2cs");
    			add_location(td7, file, 229, 4, 5105);
    			add_location(tr5, file, 227, 3, 5064);
    			add_location(code14, file, 232, 8, 5160);
    			attr_dev(td8, "class", "svelte-blc2cs");
    			add_location(td8, file, 232, 4, 5156);
    			add_location(small9, file, 233, 9, 5193);
    			attr_dev(td9, "class", "svelte-blc2cs");
    			add_location(td9, file, 233, 4, 5188);
    			add_location(tr6, file, 231, 3, 5147);
    			add_location(code15, file, 236, 8, 5243);
    			attr_dev(td10, "class", "svelte-blc2cs");
    			add_location(td10, file, 236, 4, 5239);
    			add_location(small10, file, 237, 9, 5278);
    			set_style(small11, "color", "#5f5f5f");
    			add_location(small11, file, 237, 38, 5307);
    			attr_dev(td11, "class", "svelte-blc2cs");
    			add_location(td11, file, 237, 4, 5273);
    			add_location(tr7, file, 235, 3, 5230);
    			attr_dev(table1, "class", "svelte-blc2cs");
    			add_location(table1, file, 222, 2, 4998);
    			attr_dev(h32, "class", "svelte-blc2cs");
    			add_location(h32, file, 240, 2, 5383);
    			attr_dev(th4, "class", "svelte-blc2cs");
    			add_location(th4, file, 243, 4, 5434);
    			attr_dev(th5, "class", "svelte-blc2cs");
    			add_location(th5, file, 244, 4, 5452);
    			attr_dev(th6, "class", "svelte-blc2cs");
    			add_location(th6, file, 245, 4, 5472);
    			attr_dev(th7, "class", "svelte-blc2cs");
    			add_location(th7, file, 246, 4, 5497);
    			add_location(tr8, file, 242, 3, 5425);
    			add_location(code16, file, 249, 8, 5537);
    			attr_dev(td12, "class", "svelte-blc2cs");
    			add_location(td12, file, 249, 4, 5533);
    			add_location(small12, file, 250, 9, 5571);
    			attr_dev(td13, "class", "svelte-blc2cs");
    			add_location(td13, file, 250, 4, 5566);
    			attr_dev(td14, "class", "svelte-blc2cs");
    			add_location(td14, file, 251, 4, 5600);
    			attr_dev(a3, "href", "https://github.com/imager-io/imager-tools");
    			add_location(a3, file, 253, 5, 5648);
    			attr_dev(a4, "href", "https://github.com/imager-io/imager/blob/master/docs/bin/imager-cli.md");
    			add_location(a4, file, 255, 5, 5723);
    			attr_dev(td15, "class", "svelte-blc2cs");
    			add_location(td15, file, 252, 4, 5638);
    			add_location(tr9, file, 248, 3, 5524);
    			add_location(code17, file, 259, 8, 5857);
    			attr_dev(td16, "class", "svelte-blc2cs");
    			add_location(td16, file, 259, 4, 5853);
    			add_location(small13, file, 260, 9, 5898);
    			attr_dev(td17, "class", "svelte-blc2cs");
    			add_location(td17, file, 260, 4, 5893);
    			attr_dev(td18, "class", "svelte-blc2cs");
    			add_location(td18, file, 261, 4, 5927);
    			attr_dev(a5, "href", "https://github.com/imager-io/imager-tools");
    			add_location(a5, file, 263, 5, 5978);
    			attr_dev(a6, "href", "https://github.com/imager-io/imager/blob/master/docs/bin/imager-server.md");
    			add_location(a6, file, 265, 5, 6053);
    			attr_dev(td19, "class", "svelte-blc2cs");
    			add_location(td19, file, 262, 4, 5968);
    			add_location(tr10, file, 258, 3, 5844);
    			attr_dev(table2, "class", "svelte-blc2cs");
    			add_location(table2, file, 241, 2, 5414);
    			attr_dev(h33, "class", "svelte-blc2cs");
    			add_location(h33, file, 269, 2, 6187);
    			attr_dev(th8, "class", "svelte-blc2cs");
    			add_location(th8, file, 272, 4, 6236);
    			attr_dev(th9, "class", "svelte-blc2cs");
    			add_location(th9, file, 273, 4, 6254);
    			attr_dev(th10, "class", "svelte-blc2cs");
    			add_location(th10, file, 274, 4, 6274);
    			attr_dev(th11, "class", "svelte-blc2cs");
    			add_location(th11, file, 275, 4, 6299);
    			add_location(tr11, file, 271, 3, 6227);
    			add_location(code18, file, 278, 8, 6339);
    			attr_dev(td20, "class", "svelte-blc2cs");
    			add_location(td20, file, 278, 4, 6335);
    			add_location(small14, file, 279, 9, 6374);
    			attr_dev(td21, "class", "svelte-blc2cs");
    			add_location(td21, file, 279, 4, 6369);
    			attr_dev(td22, "class", "svelte-blc2cs");
    			add_location(td22, file, 280, 4, 6409);
    			attr_dev(a7, "href", "https://github.com/imager-io/webpack-imager-example-vanilla");
    			add_location(a7, file, 281, 8, 6448);
    			attr_dev(td23, "class", "svelte-blc2cs");
    			add_location(td23, file, 281, 4, 6444);
    			add_location(tr12, file, 277, 3, 6326);
    			attr_dev(table3, "class", "svelte-blc2cs");
    			add_location(table3, file, 270, 2, 6216);
    			attr_dev(h34, "class", "svelte-blc2cs");
    			add_location(h34, file, 284, 2, 6557);
    			attr_dev(th12, "class", "svelte-blc2cs");
    			add_location(th12, file, 287, 4, 6598);
    			attr_dev(th13, "class", "svelte-blc2cs");
    			add_location(th13, file, 288, 4, 6616);
    			attr_dev(th14, "class", "svelte-blc2cs");
    			add_location(th14, file, 289, 4, 6636);
    			attr_dev(th15, "class", "svelte-blc2cs");
    			add_location(th15, file, 290, 4, 6664);
    			add_location(tr13, file, 286, 3, 6589);
    			attr_dev(td24, "class", "svelte-blc2cs");
    			add_location(td24, file, 293, 4, 6700);
    			add_location(small15, file, 294, 9, 6725);
    			attr_dev(td25, "class", "svelte-blc2cs");
    			add_location(td25, file, 294, 4, 6720);
    			add_location(small16, file, 295, 9, 6759);
    			attr_dev(td26, "class", "svelte-blc2cs");
    			add_location(td26, file, 295, 4, 6754);
    			attr_dev(a8, "href", "https://github.com/imager-io/imager-io-js");
    			add_location(a8, file, 297, 5, 6797);
    			attr_dev(a9, "href", "https://github.com/imager-io/imager-io-js/tree/master/docs");
    			add_location(a9, file, 299, 5, 6872);
    			attr_dev(a10, "href", "https://github.com/imager-io/imager-nodejs-example");
    			add_location(a10, file, 301, 5, 6971);
    			attr_dev(a11, "href", "https://www.npmjs.com/package/imager-io");
    			add_location(a11, file, 303, 5, 7056);
    			attr_dev(td27, "class", "svelte-blc2cs");
    			add_location(td27, file, 296, 4, 6787);
    			add_location(tr14, file, 292, 3, 6691);
    			attr_dev(table4, "class", "svelte-blc2cs");
    			add_location(table4, file, 285, 2, 6578);
    			attr_dev(h35, "class", "svelte-blc2cs");
    			add_location(h35, file, 307, 2, 7146);
    			attr_dev(th16, "class", "svelte-blc2cs");
    			add_location(th16, file, 310, 4, 7197);
    			attr_dev(th17, "class", "svelte-blc2cs");
    			add_location(th17, file, 311, 4, 7215);
    			attr_dev(th18, "class", "svelte-blc2cs");
    			add_location(th18, file, 312, 4, 7235);
    			add_location(tr15, file, 309, 3, 7188);
    			attr_dev(td28, "class", "svelte-blc2cs");
    			add_location(td28, file, 315, 4, 7277);
    			attr_dev(a12, "href", "https://github.com/imager-io/imager-core");
    			add_location(a12, file, 316, 8, 7306);
    			attr_dev(td29, "class", "svelte-blc2cs");
    			add_location(td29, file, 316, 4, 7302);
    			attr_dev(td30, "class", "svelte-blc2cs");
    			add_location(td30, file, 317, 4, 7377);
    			add_location(tr16, file, 314, 3, 7268);
    			attr_dev(td31, "class", "svelte-blc2cs");
    			add_location(td31, file, 320, 4, 7446);
    			attr_dev(a13, "href", "https://github.com/imager-io/imager-advanced");
    			add_location(a13, file, 321, 8, 7479);
    			attr_dev(td32, "class", "svelte-blc2cs");
    			add_location(td32, file, 321, 4, 7475);
    			attr_dev(td33, "class", "svelte-blc2cs");
    			add_location(td33, file, 322, 4, 7554);
    			add_location(tr17, file, 319, 3, 7437);
    			attr_dev(table5, "class", "svelte-blc2cs");
    			add_location(table5, file, 308, 2, 7177);
    			attr_dev(section3, "class", "svelte-blc2cs");
    			add_location(section3, file, 220, 1, 4957);
    			attr_dev(h24, "class", "svelte-blc2cs");
    			add_location(h24, file, 327, 1, 7624);
    			attr_dev(a14, "href", "https://medium.com/@colbyn/modern-image-optimization-for-2020-issues-solutions-and-open-source-solutions-543af00e3e51");
    			add_location(a14, file, 330, 7, 7667);
    			add_location(li, file, 330, 3, 7663);
    			attr_dev(ul, "class", "svelte-blc2cs");
    			add_location(ul, file, 329, 2, 7655);
    			attr_dev(section4, "class", "svelte-blc2cs");
    			add_location(section4, file, 328, 1, 7643);
    			attr_dev(main, "class", "svelte-blc2cs");
    			add_location(main, file, 158, 0, 2757);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, hr);
    			append_dev(div0, t2);
    			append_dev(div0, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t3);
    			append_dev(a0, span0);
    			append_dev(div0, t5);
    			append_dev(div0, a1);
    			append_dev(a1, i1);
    			append_dev(a1, t6);
    			append_dev(a1, span1);
    			append_dev(header, t8);
    			append_dev(header, div1);
    			append_dev(div1, p0);
    			append_dev(p0, b0);
    			append_dev(p0, t10);
    			append_dev(p0, small0);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h20);
    			append_dev(main, t14);
    			append_dev(main, section0);
    			append_dev(section0, h30);
    			append_dev(section0, t16);
    			append_dev(section0, blockquote);
    			append_dev(section0, t18);
    			append_dev(section0, p1);
    			append_dev(p1, t19);
    			append_dev(p1, small1);
    			append_dev(p1, t21);
    			append_dev(p1, b1);
    			append_dev(p1, t23);
    			append_dev(section0, t24);
    			append_dev(section0, p2);
    			append_dev(section0, t26);
    			append_dev(section0, small2);
    			append_dev(section0, t28);
    			append_dev(section0, pre0);
    			append_dev(pre0, t29);
    			append_dev(pre0, code0);
    			append_dev(pre0, t31);
    			append_dev(pre0, code1);
    			append_dev(section0, t33);
    			append_dev(section0, small3);
    			append_dev(section0, t35);
    			append_dev(section0, pre1);
    			append_dev(pre1, t36);
    			append_dev(pre1, code2);
    			append_dev(pre1, t38);
    			append_dev(pre1, code3);
    			append_dev(section0, t40);
    			append_dev(section0, small4);
    			append_dev(small4, t41);
    			append_dev(small4, em);
    			append_dev(small4, t43);
    			append_dev(section0, t44);
    			append_dev(section0, pre2);
    			append_dev(pre2, t45);
    			append_dev(pre2, code4);
    			append_dev(pre2, t47);
    			append_dev(pre2, code5);
    			append_dev(pre2, t49);
    			append_dev(pre2, code6);
    			append_dev(pre2, t51);
    			append_dev(pre2, code8);
    			append_dev(code8, t52);
    			append_dev(code8, code7);
    			append_dev(code8, t54);
    			append_dev(pre2, t55);
    			append_dev(pre2, code9);
    			append_dev(pre2, t57);
    			append_dev(pre2, code11);
    			append_dev(code11, t58);
    			append_dev(code11, code10);
    			append_dev(code11, t60);
    			append_dev(pre2, t61);
    			append_dev(pre2, code12);
    			append_dev(pre2, t63);
    			append_dev(main, t64);
    			append_dev(main, h21);
    			append_dev(h21, a2);
    			append_dev(a2, t65);
    			append_dev(a2, i2);
    			append_dev(main, t66);
    			append_dev(main, section1);
    			append_dev(section1, pre3);
    			append_dev(main, t68);
    			append_dev(main, h22);
    			append_dev(main, t70);
    			append_dev(main, section2);
    			append_dev(section2, table0);
    			append_dev(table0, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t72);
    			append_dev(tr0, th1);
    			append_dev(table0, t74);
    			append_dev(table0, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t76);
    			append_dev(tr1, td1);
    			append_dev(td1, t77);
    			append_dev(td1, small5);
    			append_dev(table0, t79);
    			append_dev(table0, tr2);
    			append_dev(tr2, td2);
    			append_dev(tr2, t81);
    			append_dev(tr2, td3);
    			append_dev(td3, t82);
    			append_dev(td3, small6);
    			append_dev(table0, t84);
    			append_dev(table0, tr3);
    			append_dev(tr3, td4);
    			append_dev(tr3, t86);
    			append_dev(tr3, td5);
    			append_dev(td5, t87);
    			append_dev(td5, small7);
    			append_dev(main, t89);
    			append_dev(main, h23);
    			append_dev(main, t91);
    			append_dev(main, section3);
    			append_dev(section3, h31);
    			append_dev(section3, t93);
    			append_dev(section3, table1);
    			append_dev(table1, tr4);
    			append_dev(tr4, th2);
    			append_dev(tr4, t95);
    			append_dev(tr4, th3);
    			append_dev(table1, t97);
    			append_dev(table1, tr5);
    			append_dev(tr5, td6);
    			append_dev(td6, code13);
    			append_dev(tr5, t99);
    			append_dev(tr5, td7);
    			append_dev(td7, t100);
    			append_dev(td7, small8);
    			append_dev(table1, t102);
    			append_dev(table1, tr6);
    			append_dev(tr6, td8);
    			append_dev(td8, code14);
    			append_dev(tr6, t104);
    			append_dev(tr6, td9);
    			append_dev(td9, t105);
    			append_dev(td9, small9);
    			append_dev(table1, t107);
    			append_dev(table1, tr7);
    			append_dev(tr7, td10);
    			append_dev(td10, code15);
    			append_dev(tr7, t109);
    			append_dev(tr7, td11);
    			append_dev(td11, t110);
    			append_dev(td11, small10);
    			append_dev(td11, t112);
    			append_dev(td11, small11);
    			append_dev(section3, t114);
    			append_dev(section3, h32);
    			append_dev(section3, t116);
    			append_dev(section3, table2);
    			append_dev(table2, tr8);
    			append_dev(tr8, th4);
    			append_dev(tr8, t118);
    			append_dev(tr8, th5);
    			append_dev(tr8, t120);
    			append_dev(tr8, th6);
    			append_dev(tr8, t122);
    			append_dev(tr8, th7);
    			append_dev(table2, t124);
    			append_dev(table2, tr9);
    			append_dev(tr9, td12);
    			append_dev(td12, code16);
    			append_dev(tr9, t126);
    			append_dev(tr9, td13);
    			append_dev(td13, t127);
    			append_dev(td13, small12);
    			append_dev(tr9, t129);
    			append_dev(tr9, td14);
    			append_dev(tr9, t131);
    			append_dev(tr9, td15);
    			append_dev(td15, a3);
    			append_dev(td15, t133);
    			append_dev(td15, a4);
    			append_dev(table2, t135);
    			append_dev(table2, tr10);
    			append_dev(tr10, td16);
    			append_dev(td16, code17);
    			append_dev(tr10, t137);
    			append_dev(tr10, td17);
    			append_dev(td17, t138);
    			append_dev(td17, small13);
    			append_dev(tr10, t140);
    			append_dev(tr10, td18);
    			append_dev(tr10, t142);
    			append_dev(tr10, td19);
    			append_dev(td19, a5);
    			append_dev(td19, t144);
    			append_dev(td19, a6);
    			append_dev(section3, t146);
    			append_dev(section3, h33);
    			append_dev(section3, t148);
    			append_dev(section3, table3);
    			append_dev(table3, tr11);
    			append_dev(tr11, th8);
    			append_dev(tr11, t150);
    			append_dev(tr11, th9);
    			append_dev(tr11, t152);
    			append_dev(tr11, th10);
    			append_dev(tr11, t154);
    			append_dev(tr11, th11);
    			append_dev(table3, t156);
    			append_dev(table3, tr12);
    			append_dev(tr12, td20);
    			append_dev(td20, code18);
    			append_dev(tr12, t158);
    			append_dev(tr12, td21);
    			append_dev(td21, t159);
    			append_dev(td21, small14);
    			append_dev(tr12, t161);
    			append_dev(tr12, td22);
    			append_dev(tr12, t163);
    			append_dev(tr12, td23);
    			append_dev(td23, a7);
    			append_dev(section3, t165);
    			append_dev(section3, h34);
    			append_dev(section3, t167);
    			append_dev(section3, table4);
    			append_dev(table4, tr13);
    			append_dev(tr13, th12);
    			append_dev(tr13, t169);
    			append_dev(tr13, th13);
    			append_dev(tr13, t171);
    			append_dev(tr13, th14);
    			append_dev(tr13, t173);
    			append_dev(tr13, th15);
    			append_dev(table4, t175);
    			append_dev(table4, tr14);
    			append_dev(tr14, td24);
    			append_dev(tr14, t177);
    			append_dev(tr14, td25);
    			append_dev(td25, t178);
    			append_dev(td25, small15);
    			append_dev(tr14, t180);
    			append_dev(tr14, td26);
    			append_dev(td26, t181);
    			append_dev(td26, small16);
    			append_dev(tr14, t183);
    			append_dev(tr14, td27);
    			append_dev(td27, a8);
    			append_dev(td27, t185);
    			append_dev(td27, a9);
    			append_dev(td27, t187);
    			append_dev(td27, a10);
    			append_dev(td27, t189);
    			append_dev(td27, a11);
    			append_dev(section3, t191);
    			append_dev(section3, h35);
    			append_dev(section3, t193);
    			append_dev(section3, table5);
    			append_dev(table5, tr15);
    			append_dev(tr15, th16);
    			append_dev(tr15, t195);
    			append_dev(tr15, th17);
    			append_dev(tr15, t197);
    			append_dev(tr15, th18);
    			append_dev(table5, t199);
    			append_dev(table5, tr16);
    			append_dev(tr16, td28);
    			append_dev(tr16, t201);
    			append_dev(tr16, td29);
    			append_dev(td29, a12);
    			append_dev(tr16, t203);
    			append_dev(tr16, td30);
    			append_dev(table5, t205);
    			append_dev(table5, tr17);
    			append_dev(tr17, td31);
    			append_dev(tr17, t207);
    			append_dev(tr17, td32);
    			append_dev(td32, a13);
    			append_dev(tr17, t209);
    			append_dev(tr17, td33);
    			append_dev(main, t211);
    			append_dev(main, h24);
    			append_dev(main, t213);
    			append_dev(main, section4);
    			append_dev(section4, ul);
    			append_dev(ul, li);
    			append_dev(li, a14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
