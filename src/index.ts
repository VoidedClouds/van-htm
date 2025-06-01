import type htm from 'htm';
import type { ChildDom, Props, PropsWithKnownKeys, State, TagFunc, Van } from 'vanjs-core';
import type { KeyType, ValueType, list } from 'vanjs-ext';

export type { ChildDom, Van, htm, list };

/**
 * Configuration options for initializing a VanHTM instance.
 */
export type VanHTMOptions = {
  /** The htm template literal parser instance. */
  htm: typeof htm;
  /**
   * A VanJS instance (or a compatible subset) providing `add` and `tags` functionalities.
   */
  van: Pick<Van, 'add' | 'tags'>;
  /**
   * Optional, an object containing VanJS extensions.
   * `list` from `vanjs-ext` is required for the `for:each` directive.
   */
  vanX?: {
    list: typeof list;
  };
  /**
   * Optional HTML entity decoder function.
   * This function is applied to static text content within templates.
   * It is required if using a build of `van-htm` that has decoding enabled (e.g., `/withDecoding`).
   * The function should take a string with HTML entities (e.g., '&amp;') and return a string with decoded characters (e.g., '&').
   * @param input The string containing HTML entities.
   * @returns The string with HTML entities decoded.
   */
  decode?: (input: string) => string;
};

/**
 * Represents a VanHTM instance, providing template literal functionality and portal management.
 */
export type VanHTM = {
  /**
   * An htm-compatible template literal tag function.
   * Parses HTML-like template strings and produces VanJS DOM elements or ChildDom.
   * Supports special directives like `for:each`, `show:when`, `show:fallback`, and `portal:mount`.
   * @param template The template string array.
   * @param substitutions Values to be interpolated into the template.
   * @returns The DOM element(s) or ChildDom generated from the template.
   */
  html: (template: TemplateStringsArray, ...substitutions: unknown[]) => ChildDom;
  /**
   * Removes portal elements that were previously rendered by this VanHTM instance.
   * It searches for comment placeholders within the `parent` node and removes
   * corresponding elements from the `portalTarget` (or document.body by default)
   * using querySelector.
   * @param parent The parent Node where the portal placeholder comments were rendered.
   * @param portalTarget Optional. The Element or CSS selector string for the container
   *                     where portal content was mounted. Defaults to `document.body`.
   */
  rmPortals: (parent: Node, portalTarget?: Element | string) => void;
};

/**
 * The itemFunc that the `for:each` directive uses with vanX.list.
 * Refer to https://vanjs.org/x for more details.
 * The function `((v, deleter, k) => Node)` is used to generate the UI element (or rarely, text node) for each list item.
 * @template T The type of the items in the list <typeof items> (items must be vanX.reactive).
 * @param v A State object corresponding to each list item.
 * You can directly use it as a State-based property / child node, read its value for building the UI element, and/or set its value in some event handlers.
 * @param deleter A function (() => void) that can be used in the event handler to delete the entire item.
 * Typically the deleter function can be used as the onclick handler of a deletion button.
 * @param k (Requires VanX 0.2.0 or later) the key of the corresponding list item, which is the index if items is an Array or the property key if items is a plain object.
 * @returns The Node or DOM element to be rendered for the item.
 */
export type ListItemFunction<T extends object> = (v: State<ValueType<T>>, deleter: () => void, k: KeyType<T>) => Node;
type PropsCombined = Props &
  PropsWithKnownKeys<Element> & {
    'p:id'?: string;
  };

/**
 * Creates a VanHTM instance that provides HTML template literal functionality with VanJS integration.
 *
 * @param options - Configuration object for VanHTM
 * @param options.htm - The htm template literal parser
 * @param options.van - VanJS instance with 'add' and 'tags' methods
 * @param options.vanX - VanJS extensions object containing the 'list' function
 * @param options.decode - Optional HTML entity decoder function for template content, required in builds `withDecoding`
 *
 * @returns VanHTM instance with html template function and portal management (rmPortals)
 *
 * @example
 * ```typescript
 * import htm from 'htm';
 * import van from 'vanjs-core';
 * import { list, reactive } from 'vanjs-ext';
 * import vanHTM from 'van-htm';
 *
 * const { html } = vanHTM({ htm, van, vanX: { list } });
 *
 * // Basic usage
 * const element = html`<div>Hello World</div>`;
 *
 * // With conditional rendering
 * const conditional = html`<div show:when=${true}>Visible</div>`;
 *
 * // With loops
 * const items = reactive([1, 2, 3]);
 * const list = html`<ul for:each=${items}>${(v) => html`<li>${v}</li>`}</ul>`;
 *
 * // With portals
 * const portal = html`<div portal:mount="body">Portaled content</div>`;
 *
 * van.add(document.body, element, conditional, list);
 * ```
 */
const vanHTM = (options: VanHTMOptions): VanHTM => {
  const { htm, van, vanX } = options;
  let decode: ((input: string) => string) | undefined;

  if (__HTML_ENTITY_DECODING__) {
    decode = options?.decode;
  }

  const _document = document;
  const _undefined = undefined;

  const isFunctionInstance = (object: unknown): object is Function => object instanceof Function;
  const isTypeOfString = (value: unknown): value is string => typeof value === 'string';
  const objectHasOwn = Object.hasOwn;

  const directives = {
    f: { e: 'for:each' as const },
    p: { m: 'portal:mount' as const },
    s: { f: 'show:fallback' as const, w: 'show:when' as const },
    svg: 'vh:svg' as const
  } as const;

  const extractProperty = <T>(object: PropsCombined, key: string): T => {
    const value = object[key] as T;
    delete object[key];
    return value;
  };

  const hasShowWhenProperty = (props: PropsCombined): boolean => objectHasOwn(props, directives.s.w);

  const handleShow = (
    fnOrNode: TagFunc<Element> | (() => ChildDom) | ChildDom,
    props: PropsCombined,
    children: ChildDom[] | undefined,
    isTag: boolean = true
  ): ChildDom => {
    let fallback = extractProperty<ChildDom>(props, directives.s.f) ?? '';
    let when = extractProperty<boolean | (() => boolean) | State<boolean>>(props, directives.s.w);

    return () => {
      let condition = (when as State<boolean>)?.val !== undefined ? (when as State<boolean>).val : isFunctionInstance(when) ? when() : when;

      return condition
        ? isTag
          ? (fnOrNode as TagFunc<Element>)(props, ...(children as ChildDom[]))
          : (fnOrNode as Function)()
        : isFunctionInstance(fallback)
        ? fallback()
        : fallback;
    };
  };

  let portalIdCounter: number = 0;
  const handleFor = <T extends object>(tag: TagFunc<Element>, props: PropsCombined, itemFunc: ListItemFunction<T>): ChildDom => {
      const items = extractProperty<T>(props, directives.f.e);
      const listFn = () => vanX!.list(tag(props), items, itemFunc);

      return hasShowWhenProperty(props) ? handleShow(listFn, props as PropsCombined, _undefined, false) : listFn();
    },
    handlePortal = (tag: TagFunc<Element>, props: PropsCombined, children: ChildDom[]): Comment => {
      const mount = extractProperty<Element | string>(props, directives.p.m);
      const targetElement = isTypeOfString(mount) ? _document.querySelector(mount) : (mount as Element);

      const portalId = `p-${portalIdCounter++}`;
      props['p:id'] = portalId;

      const portalContentFn = () => tag(props, ...children);
      van.add(
        targetElement as Element,
        hasShowWhenProperty(props) ? handleShow(portalContentFn, props, _undefined, false) : portalContentFn()
      );

      // Create and return a unique comment node as a placeholder
      return _document.createComment(portalId);
    };

  // SVG element types that require namespace
  // Excludes overlapping HTML tags: a, image, script, style, title
  // These elements exist in both HTML and SVG but should use HTML namespace by default
  // Also excludes rarely used elements: animate*, fe* (filter effects), metadata, mpath, set, switch, view
  // For full SVG support, use vh:svg directive on specific elements
  // prettier-ignore
  const svgElements = new Set([
    'circle', 'clipPath', 'defs', 'desc', 'ellipse', 'filter', 'foreignObject',
    'g', 'line', 'linearGradient', 'marker', 'mask', 'path', 'pattern', 
    'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'symbol',
    'text', 'textPath', 'tspan', 'use'
  ]);

  function h<T extends object>(
    this: [number, ...unknown[]],
    type: string,
    props?: PropsCombined | null | undefined,
    ...children: (ChildDom | ListItemFunction<T>)[]
  ): ChildDom {
    // Disable caching of created elements https://github.com/developit/htm/#caching
    this[0] = 3;

    // Check for vh:svg directive first, then fall back to svgElements set
    // Check if this is an SVG element and use the appropriate namespace
    const tag = (props && objectHasOwn(props, directives.svg) ? !!extractProperty<boolean>(props, directives.svg) : svgElements.has(type))
      ? van.tags('http://www.w3.org/2000/svg')[type]
      : van.tags[type];

    const decodedChildren = __HTML_ENTITY_DECODING__
      ? children?.map((child) => (isTypeOfString(child) ? decode!(child) : child))
      : children;

    // If attributes/properties have been passed to the element, check for Control Flow Directives
    if (props) {
      if (objectHasOwn(props, directives.f.e)) {
        return handleFor(tag, props, decodedChildren[0] as ListItemFunction<T>);
      } else if (objectHasOwn(props, directives.p.m)) {
        return handlePortal(tag, props, decodedChildren as ChildDom[]);
      } else if (objectHasOwn(props, directives.s.w)) {
        return handleShow(tag, props, decodedChildren as ChildDom[]);
      }
    }

    return tag(props, ...(decodedChildren as ChildDom[]));
  }

  return {
    html: htm.bind(h),
    rmPortals: (parent: Node, portalTarget: Element | string = _document.body): void => {
      let targetElem = isTypeOfString(portalTarget) ? _document.querySelector(portalTarget) : portalTarget;

      if (!targetElem) return;

      const result: string[] = [];
      let child = parent.firstChild;
      while (child) {
        if (child.nodeType === Node.COMMENT_NODE && (child as Comment).data.startsWith('p-')) {
          result.push((child as Comment).data);
        }
        child = child.nextSibling;
      }

      // Find and remove the portaled element with attribute p:id === portalId
      for (const portalId of result) targetElem.querySelector(`[p\\:id="${portalId}"]`)?.remove();
    }
  };
};

export default vanHTM;
