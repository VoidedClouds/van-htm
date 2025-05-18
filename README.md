# Van HTM

A flexible [HTM](https://github.com/developit/htm) integration for [VanJS](https://vanjs.org) and [VanX](https://vanjs.org/x), supporting control flow directives and HTML entity decoding. [Here's a sample](https://jsfiddle.net/VoidedClouds/4oxq78ag/) based on the [simplified TODO App](https://vanjs.org/x#a-simplified-todo-app) from [VanJS](https://vanjs.org).

## Features

- **Tagged Template HTML**: Write JSX-like templates in plain JavaScript using [HTM](https://github.com/developit/htm) with [VanJS](https://vanjs.org), no build step required.
- **[Control Flow Directives](#control-flow-directives)**: Use [`for:each`](#foreach), [`show:when`](#showwhen), and [`portal:mount`](#portalmount) for [SolidJS](https://www.solidjs.com) style declarative rendering and portals (requires [VanX](https://vanjs.org/x)).
- **HTML Entity Decoding**: Decode HTML entities in string children (requires a HTML entities library like [entities](https://github.com/fb55/entities), [he](https://github.com/mathiasbynens/he), [html-entities](https://github.com/mdevils/html-entities), etc.).

## Usage

```js
// These imports could also be globally available
import htm from 'htm';
import { decode } from 'html-entities';
import van from 'vanjs-core';
import * as vanX from 'vanjs-ext';
import vanHtm from 'vanjs-htm';

const { html, rmPortals } = vanHtm({ htm, van, vanX, decode });

const el = html`
  <div>
    Hello,
    <b>world</b>
    !
  </div>
`;
van.add(document.body, el);
```

## Browser Builds

Van HTM provides several prebuilt bundles for browser usage, available via CDN (e.g., [jsDelivr](https://cdn.jsdelivr.net/npm/vanjs-htm/dist/)). You can choose the build that best fits your needs. If you choose a build that drops a feature you can exclude the corresponding library from the vanHtm options:

**Build output structure:**

- `dist/` contains full-featured builds with Controls Flows and HTML Entity Decoding.
- `dist/noCF/` excludes Control Flows.
- `dist/noDec/` excludes HTML Entity Decoding.
- `dist/noCF-noDec/` excludes both.

Each directory contains:

- `van-htm.mjs` (ESM, minified)
- `van-htm.global.js` (IIFE/global, minified)
- `dev.van-htm.mjs` (ESM, unminified)
- `dev.van-htm.global.js` (IIFE/global, unminified)

## Additional Usage Information

### Control Flow Directives

> **Note:** Control flow directives require [VanX](https://vanjs.org/x).

#### for:each

Renders a list by looping over a reactive array or iterable. The value of `for:each` should be a reactive list (e.g., from `vanX.reactive`). The child function receives the current value, a deleter function, and the index/key.

```js
const items = vanX.reactive([1, 2, 3]);
const list = html`
  <ul for:each=${items}>
    ${(v, deleter, k) =>
      html`
        <li>${v}</li>
      `}
  </ul>
`;
van.add(document.body, list);
```

See [VanX docs: Reactive List](https://vanjs.org/x#reactive-list) for more details on the `itemFunction` signature.

#### show:when

Conditionally renders content based on a boolean, a VanJS state, or a function. If the condition is falsy, the `show:fallback` value is rendered instead (can be a primitive, a state or a function if you need reactivity).

```js
const visible = van.state(true);
const content = html`
  <div
    show:when=${visible}
    show:fallback=${() =>
      html`
        <b>Fallback - ${visible}</b>
      `}
  >
    Visible - ${visible}
  </div>
`;
van.add(document.body, content);
```

- `show:when`: Accepts a boolean, a VanJS state, or a function returning a boolean.
- `show:fallback`: (Optional) Content to render when the condition is falsy. Can be a primitive, a state or a function if you need reactivity.

#### portal:mount

Renders the element into a different part of the DOM (a "portal"). The `portal:mount` attribute determines where the content is rendered. It can be:

- A DOM `Node`
- A CSS selector string (e.g., `#modal-root`)

> **Note:** For `rmPortals` to work correctly, portals should only be nested as direct children (first child level) of their parent element. Nesting portals deeper will prevent `rmPortals` from removing them properly.

```js
const portalTarget = document.getElementById('portal-target');
const containerWithPortal = html`
  <div id="container">
    <div>Some content before</div>
    <div portal:mount=${portalTarget}>Content to Portal</div>
    <div>Some content after</div>
  </div>
`;
van.add(document.body, containerWithPortal);
```

You can also use a selector:

```js
const containerWithPortal = html`
  <div id="container">
    <div>Some content before</div>
    <div portal:mount="#portal-target">Content to Portal</div>
    <div>Some content after</div>
  </div>
`;
```

### Removing Portaled Elements

```js
// Removes all portaled elements created from `parentContainer` that are mounted in `portalTarget` (or `document.body`).
rmPortals(parentContainer, portalTarget?);
```

## API

### `vanHtm(options)`

- `htm`: Required in all builds. The HTM instance.
- `van`: Required in all builds. The VanJS instance.
- `vanX`: Required in builds that include Control Flows. The VanJS Extension instance.
- `decode`: Required in builds that include HTML Entity Decoding. The decode method from a HTML entities library like [entities](https://github.com/fb55/entities), [he](https://github.com/mathiasbynens/he), [html-entities](https://github.com/mdevils/html-entities), etc.

Returns:

- `html`: The htm template tag.
- `rmPortals(parentContainer, portalTarget?)`: Remove portaled elements created from `parentContainer` in `portalTarget` (or `document.body`).

## License

MIT
