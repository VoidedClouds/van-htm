# VanHTM

A flexible and lightweight ([<700B gzipped minified](#browser-builds)) [HTM](https://github.com/developit/htm) integration for [VanJS](https://vanjs.org) and optionally [VanX](https://vanjs.org/x), supporting control flow directives and optional HTML entity decoding.

[Here's a sample](https://codepen.io/VoidedClouds/pen/myygzNQ) based on the [simplified TODO App](https://vanjs.org/x#a-simplified-todo-app) from [VanJS](https://vanjs.org).

## Features

- **Tagged Template HTML**: Write JSX-like templates in plain JavaScript using [HTM](https://github.com/developit/htm) with [VanJS](https://vanjs.org), no build step required.
- **[Control Flow Directives](#control-flow-directives)**: Use [`for:each`](#foreach), [`show:when`](#showwhen), and [`portal:mount`](#portalmount) for [SolidJS](https://www.solidjs.com) style declarative rendering. You can also combine `show:when` with `for:each` and `portal:mount` to [conditionally render lists and portals](#combining-showwhen-with-foreach-and-portalmount). Note: [VanX](https://vanjs.org/x) is required only for the `for:each` directive.
- **[Optional HTML Entity Decoding](#optional-html-entity-decoding)**: Decode HTML entities in string children (requires a HTML entities library like [entities](https://github.com/fb55/entities), [he](https://github.com/mathiasbynens/he), [html-entities](https://github.com/mdevils/html-entities), etc.).
- **TypeScript Support**: VanHTM is written in TypeScript and provides full type definitions.

## Usage

[Try on CodePen](https://codepen.io/VoidedClouds/pen/GggLYmx)

```js
// Script tags for including van and vanX
// <script src="https://cdn.jsdelivr.net/gh/vanjs-org/van/public/van-latest.nomodule.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/vanjs-ext/dist/van-x.nomodule.min.js"></script>

// Script tags for including htm and vanHTM
// <script src=="https://cdn.jsdelivr.net/npm/htm/dist/htm.js"></script>
// <script src=="https://cdn.jsdelivr.net/npm/vanjs-htm/dist/van-htm.js"></script>
// The imports below can be replaced by the script tags above for htm and vanHTM
import htm from 'htm';
import vanHTM from 'vanjs-htm';

// const { html, rmPortals } = vanHTM({ htm, van, vanX }); // This line and the one below are interchangeable
const { html, rmPortals } = vanHTM({ htm, van, vanX: { list: vanX.list } });

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

VanHTM provides several prebuilt bundles for browser usage, available via CDN (e.g., [jsDelivr](https://www.jsdelivr.com/package/npm/vanjs-htm)). You can choose the build that best fits your needs.

**Build output structure:**

- `dist/` default builds.
- `dist/withDecoding/` builds that utilize [HTML Entity Decoding](#optional-html-entity-decoding) (requires a HTML entities library like [entities](https://github.com/fb55/entities), [he](https://github.com/mathiasbynens/he), [html-entities](https://github.com/mdevils/html-entities), etc.).

Each directory contains:

- `van-htm.module.js` (ESM, minified, 684B gzipped)
- `van-htm.js` (IIFE/global, minified, 690B gzipped)
- `van-htm.cjs` (CJS, minified)
- `van-htm.dev.module.js` (ESM, unminified)
- `van-htm.dev.js` (IIFE/global, unminified)

## Control Flow Directives

### for:each

Renders a list by looping over a reactive array or iterable. The value of `for:each` should be a reactive list (e.g., from `vanX.reactive`). The child function receives the current value, a deleter function, and the index/key.

**Note:** This directive requires [VanX](https://vanjs.org/x). If `vanX` is not provided to `vanHTM()` and you attempt to use `for:each`, an error will occur.

[Try on CodePen](https://codepen.io/VoidedClouds/pen/raabqja)

```js
const items = vanX.reactive([1, 2, 3]);
van.add(
  document.body,
  html`
    <ul for:each=${items}>
      ${(v, deleter, k) =>
        html`
          <li>${v}</li>
        `}
    </ul>
  `
);
```

See [VanX docs: Reactive List](https://vanjs.org/x#reactive-list) for more details on the `itemFunc` parameter.

### show:when

Conditionally renders content based on a boolean, a VanJS state, or a function. If the condition is falsy, the `show:fallback` value is rendered instead (can be a primitive, a state or a function if you need reactivity).

[Try on CodePen](https://codepen.io/VoidedClouds/pen/emmoPyp)

```js
const visible = van.state(true);
const toggleButton = html`
  <button onclick=${() => (visible.val = !visible.val)}>Toggle Visible</button>
`;
van.add(
  document.body,
  html`
    <div>
      ${toggleButton}
      <div
        show:when=${visible}
        show:fallback=${() =>
          html`
            <div><b>Fallback - ${visible}</b></div>
          `}
      >
        Visible - ${visible}
      </div>
    </div>
  `
);
```

- `show:when`: Accepts a boolean, a VanJS state, or a function returning a boolean.
- `show:fallback`: (Optional) Content to render when the condition is falsy. Can be a primitive, a state or a function if you need reactivity.

### portal:mount

Renders the element into a different part of the DOM (a "portal"). The `portal:mount` attribute determines where the content is rendered. It can be:

- A DOM `Node`
- A CSS selector string (e.g., `#modal-root`)

> **Note:** For `rmPortals` to work correctly, portals should only be the direct child of their parent element. Nesting portals deeper will prevent `rmPortals` from removing them properly.

> **Implementation Detail:** VanHTM automatically adds a `p:id` attribute to portaled elements for internal tracking. This attribute is used by `rmPortals` to identify and remove the correct portal elements. You should not manually set or modify this attribute. [See below](#portal-implementation) for more information.

[Try on CodePen](https://codepen.io/VoidedClouds/pen/GggLYdB)

```js
const portalTarget = document.getElementById('portal-target');
const containerWithPortal = html`
  <div>
    <div>Some content before</div>
    <div portal:mount=${portalTarget}>Content to Portal</div>
    <div>Some content after</div>
    <button onclick=${() => rmPortals(containerWithPortal, portalTarget)}>Remove Portal</button>
  </div>
`;
van.add(document.body, containerWithPortal);
```

You can also use a selector:

[Try on CodePen](https://codepen.io/VoidedClouds/pen/PwwgyBy)

```js
const portalTargetId = '#portal-target';
const containerWithPortal = html`
  <div>
    <div>Some content before</div>
    <div portal:mount=${portalTargetId}>Content to Portal</div>
    <div>Some content after</div>
    <button onclick=${() => rmPortals(containerWithPortal, portalTargetId)}>Remove Portal</button>
  </div>
`;
van.add(document.body, containerWithPortal);
```

### Removing Portaled Elements

```js
// Removes all portaled elements created from `parentContainer` that are mounted in `portalTarget`.
// If no portalTarget is specified, it defaults to document.body.
rmPortals(parentContainer, portalTarget?);
```

**Parameters:**

- `parentContainer` (Node): The container element that contains the portal placeholder comments
- `portalTarget` (Element | string, optional): The target where portal content was mounted. Can be:
  - A DOM Element
  - A CSS selector string (e.g., `'#modal-root'`, `'.portal-container'`)
  - If omitted, defaults to `document.body`

**Examples:**

```js
// Remove portals mounted in a specific element
rmPortals(containerWithPortal, document.getElementById('modal-root'));

// Remove portals mounted using a CSS selector
rmPortals(containerWithPortal, '#modal-root');

// Remove portals mounted in document.body (default behavior)
rmPortals(containerWithPortal);
// Equivalent to:
rmPortals(containerWithPortal, document.body);
```

### Combining `show:when` with `for:each` and `portal:mount`

You can combine the `show:when` directive with `for:each` and `portal:mount` on the same element to conditionally render lists or portaled elements. If the `show:when` condition is falsy, neither the list nor the portal will be rendered, and the `show:fallback` (if provided) will be used instead.

**Example: Conditionally render a list**

[Try on CodePen](https://codepen.io/VoidedClouds/pen/oggKqMo)

```js
const items = vanX.reactive([1, 2, 3]);
const showList = van.state(true);

van.add(
  document.body,
  html`
    <button onclick=${() => (showList.val = !showList.val)}>Toggle List</button>
    <button onclick=${() => items.push(Object.keys(items).length + 1)}>Add item</button>
    <ul for:each=${items} show:when=${showList}>
      ${(v) =>
        html`
          <li>${v}</li>
        `}
    </ul>
  `
);
```

**Example: Conditionally render a portal**

[Try on CodePen](https://codepen.io/VoidedClouds/pen/NPPQYeZ)

```js
const getTime = () => new Date().toLocaleTimeString();
const portalTarget = document.getElementById('portal-target');
const showPortal = van.state(true);
const time = van.state(getTime());

const intervalId = setInterval(() => {
  time.val = getTime();
}, 1000);

const container = html`
  <div>
    <div portal:mount=${portalTarget} show:when=${showPortal}>Portaled Content ${time}</div>
    <button onclick=${() => (showPortal.val = !showPortal.val)}>Toggle Portal</button>
  </div>
`;
van.add(document.getElementById('main-content'), container);
```

## Optional HTML Entity Decoding

[Try on CodePen](https://codepen.io/VoidedClouds/pen/bNNyqjo)

```js
import { decode } from 'html-entities';
import vanHTM from 'vanjs-htm/withDecoding';

// const { html, rmPortals } = vanHTM({ htm, van, vanX, decode }); // This line and the one below are interchangeable
const { html, rmPortals } = vanHTM({ htm, van, vanX: { list: vanX.list }, decode });

// Example below
const el = html`
  <div>
    Hello,
    <b>world</b>
    !&nbsp;&#128526;
  </div>
`;
van.add(document.body, el);
```

## API

### `vanHTM(options)`

- `htm`: Required in all builds. The HTM instance.
- `van`: Required in all builds. The VanJS instance.
- `vanX`: Required only for the `for:each` directive. The VanJS Extension instance or an object that contains a `list` property set as `vanX.list`. If not provided and `for:each` is used, an error will occur.
- `decode`: Required in builds that include HTML Entity Decoding (`vanjs-htm/withDecoding`). The decode method from a HTML entities library like [entities](https://github.com/fb55/entities), [he](https://github.com/mathiasbynens/he), [html-entities](https://github.com/mdevils/html-entities), etc.

Returns:

- `html`: The htm template tag.
- `rmPortals(parentContainer: Node, portalTarget?: Element | string)`: Remove portaled elements created from `parentContainer`. The `portalTarget` parameter specifies where to look for the portal content:
  - Can be an Element or a CSS selector string
  - **Defaults to `document.body`** if not provided
  - Refer to the examples [here](#portalmount).

## Technical Details

### Error Handling

- **Invalid for:each Data**: The `for:each` directive relies on VanX's `list` function. Refer to [VanX documentation](https://vanjs.org/x#reactive-list) for error handling behavior with invalid reactive data.
- **Invalid Portal Selectors**: If a CSS selector provided to `portal:mount` doesn't match any element, VanJS will throw an error when attempting to mount the portal content.
- **Missing Portal Targets**: If `rmPortals` is called with an invalid selector or non-existent element, the function will silently return without performing any operations.
- **Missing VanX for for:each**: If `vanX` is not provided to `vanHTM()` and the `for:each` directive is used, an error will occur.

### HTM Caching Behavior

VanHTM explicitly disables HTM's template string caching mechanism by setting `this[0] = 3` in the template processor. This ensures that each template evaluation creates fresh elements, which is necessary for proper VanJS reactivity and state management. Refer to [HTM documentation on Caching](https://github.com/developit/htm#caching) for more information.

### Portal Implementation

VanHTM automatically adds a `p:id` attribute to portaled elements for internal tracking. This attribute uses an auto-incrementing counter (format: `p-${counter}`) and is used by `rmPortals` to identify and remove the correct portal elements. You should not manually set or modify this attribute.

## License

MIT
