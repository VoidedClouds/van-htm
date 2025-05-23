import htm from 'htm';
import type { ChildDom, Props, PropsWithKnownKeys, TagFunc, Van } from 'vanjs-core';

export type VanHTMOptions = {
  van: Van | any;
  vanX: any;
  decode?: (input: string) => string;
};

export type VanHTM = {
  html: (template: TemplateStringsArray, ...substitutions: any[]) => ChildDom;
  rmPortals: (parent: Node, portalTarget?: Element | string) => void;
};

type ControlFlowHandler = (fnOrNode: TagFunc<Element> | Function | Node, props: Props, children: ChildDom[], isTag?: boolean) => any;

const vanHTM = (options: VanHTMOptions): VanHTM => {
  const { van, vanX } = options;
  let decode: ((input: string) => string) | undefined;

  if (__HTML_ENTITY_DECODING__) {
    decode = options?.decode;
  }

  const _document = document;
  const _undefined = undefined;

  const { assign: objectAssign, entries: objectEntries, hasOwn: objectHas } = Object;
  const isFunctionInstance = (object) => object instanceof Function;
  const isTypeOfString = (value) => typeof value === 'string';

  const directives = {
    f: { e: 'for:each' },
    p: { m: 'portal:mount' },
    s: { f: 'show:fallback', w: 'show:when' }
  };

  const extractProperty = (object: Props, key: string): any => {
    const value = object[key];
    delete object[key];
    return value;
  };

  const showHandler = (
    fnOrNode: TagFunc<Element> | Function | Node,
    props: Props,
    children: ChildDom[] | undefined,
    isTag: boolean = true
  ) => {
    let fallback = extractProperty(props, directives.s.f) ?? '';
    let when = extractProperty(props, directives.s.w);

    return () => {
      let condition =
        when?.val !== undefined // Check for .val (state)
          ? when.val
          : isFunctionInstance(when)
          ? when()
          : when; // Otherwise, execute if it's a function or use directly

      return condition
        ? isTag
          ? (fnOrNode as TagFunc<Element>)(props, ...(children as ChildDom[]))
          : isFunctionInstance(fnOrNode)
          ? (fnOrNode as Function)()
          : fnOrNode
        : isFunctionInstance(fallback)
        ? fallback()
        : fallback;
    };
  };
  const hasShowWhenProperty = (props) => objectHas(props, directives.s.w);

  let portalIdCounter = 0;
  const controlFlows: Record<string, ControlFlowHandler> = {
    // For
    f: ((tag: TagFunc<Element>, props: Props, children: ChildDom[]) => {
      const items = extractProperty(props, directives.f.e);
      const listFn = () => vanX.list(tag(props), items, ...children);

      return hasShowWhenProperty(props) ? showHandler(listFn, props, _undefined, false) : listFn();
    }) as ControlFlowHandler,
    // Portal
    p: ((tag: TagFunc<Element>, props: Props, children: ChildDom[]) => {
      const mount = extractProperty(props, directives.p.m);
      // Determine the target element from the 'mount' prop
      let targetElement: Element | null = isTypeOfString(mount) // If mount is a string, assume it's a CSS selector
        ? _document.querySelector(mount)
        : mount; // Otherwise, use mount directly if mount

      const portalId = `p-${portalIdCounter++}`;
      props['p:id'] = portalId;

      const portalContentFn = () => tag(props, ...children);
      van.add(targetElement, hasShowWhenProperty(props) ? showHandler(portalContentFn, props, _undefined, false) : portalContentFn());

      // Create and return a unique comment node as a placeholder
      return _document.createComment(portalId);
    }) as ControlFlowHandler,
    // Show
    s: showHandler as ControlFlowHandler
  };

  /**
   * Creates a virtual DOM element using the specified type, props, and children.
   * Handles decoding of string children and applies control flow logic if matching attributes are found.
   *
   * @param {string} type - The tag name or component type to create.
   * @param {Object} [props] - The properties/attributes to apply to the element.
   * @param {...ChildDom} children - The child elements or strings to include as children.
   * @returns {Element | string} The created virtual DOM element or the result of a control flow handler.
   */
  function h(
    this: [number, ...unknown[]],
    type: string,
    props?: Props & PropsWithKnownKeys<Element>,
    ...children: ChildDom[]
  ): Element | string {
    // disable cache
    this[0] = 3;

    const tag: TagFunc<Element> = van.tags[type];
    const decodedChildren: ChildDom[] = __HTML_ENTITY_DECODING__
      ? children?.map((child: ChildDom) => (isTypeOfString(child) ? decode!(child) : child))
      : children;

    if (props) {
      if (objectHas(props, directives.f.e)) {
        return controlFlows.f(tag, props, decodedChildren);
      } else if (objectHas(props, directives.p.m)) {
        return controlFlows.p(tag, props, decodedChildren);
      } else if (objectHas(props, directives.s.w)) {
        return controlFlows.s(tag, props, decodedChildren);
      }
    }

    return tag(props, ...decodedChildren);
  }

  return {
    html: htm.bind(h),
    /**
     * Removes portal elements from the DOM based on portal IDs found in comments.
     *
     * @param {Node} parent - The parent node to search for portal comment IDs.
     * @param {Element | string} [portalTarget] - Optional target element to search for portal elements. Defaults to document.body if not provided.
     */
    rmPortals: (parent: Node, portalTarget: Element | string = _document.body): void => {
      let targetElem: Element | null = isTypeOfString(portalTarget) ? _document.querySelector(portalTarget) : portalTarget;

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
      for (let portalId of result) targetElem.querySelector(`[p\\:id="${portalId}"]`)?.remove();
    }
  } as VanHTM;
};

export default vanHTM;
