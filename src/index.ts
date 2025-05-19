import type htm from 'htm';
import type { ChildDom, Props, PropsWithKnownKeys, TagFunc, Van } from 'vanjs-core';

export type VanHTMOptions = {
  htm: typeof htm | any;
  van: Van | any;
  vanX?: any;
  decode?: (input: string) => string;
};

export type VanHTM = {
  html: (template: TemplateStringsArray, ...substitutions: any[]) => ChildDom;
  rmPortals?: (parent: Node, portalTarget?: Element) => void;
};

type ControlFlowHandler = (tagOrNode: TagFunc<Element> | Node, props: Props, children: ChildDom[], isTag?: boolean) => any;
type ControlFlow = ControlFlowHandler & { a: string[] };

const vanHTM = (options: VanHTMOptions): VanHTM => {
  const { htm, van } = options;
  let decode: ((input: string) => string) | undefined;
  let vanX: any;

  if (__CONTROL_FLOWS__) {
    vanX = options?.vanX;
  }

  if (__HTML_ENTITY_DECODING__) {
    decode = options?.decode;
  }

  const extractProperty = (object: Props, key: string): any => {
    const value = object[key];
    delete object[key];
    return value;
  };
  const { assign: objectAssign, entries: objectEntries, hasOwn: objectHas } = Object;
  const isFunctionInstance = (object) => object instanceof Function;
  const isTypeOfString = (value) => typeof value === 'string';

  const _document = document;
  const _undefined = undefined;

  const directives = {
    f: { e: 'for:each' },
    p: { m: 'portal:mount' },
    s: { f: 'show:fallback', w: 'show:when' }
  };

  const showHandler = (tagOrNode: TagFunc<Element> | Node, props: Props, children: ChildDom[] | undefined, isTag: boolean = true) => {
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
          ? (tagOrNode as TagFunc<Element>)(props, ...(children as ChildDom[]))
          : tagOrNode
        : isFunctionInstance(fallback)
        ? fallback()
        : fallback;
    };
  };
  const hasShowWhenProperty = (props) => objectHas(props, directives.s.w);

  let portalIdCounter = 0;
  const controlFlows: Record<string, ControlFlow> = {
    // For
    f: objectAssign(
      ((tag: TagFunc<Element>, props: Props, children: ChildDom[]) => {
        const list = vanX.list(tag(props), extractProperty(props, directives.f.e), ...children);
        return hasShowWhenProperty(props) ? showHandler(list, props, _undefined, false) : list;
      }) as ControlFlowHandler,
      { a: [directives.f.e] }
    ),
    // Portal
    p: objectAssign(
      ((tag: TagFunc<Element>, props: Props, children: ChildDom[]) => {
        const mount = extractProperty(props, directives.p.m);
        // Determine the target element from the 'mount' prop
        let targetElement: Element | null = isTypeOfString(mount) // If mount is a string, assume it's a CSS selector
          ? _document.querySelector(mount)
          : mount; // Otherwise, use mount directly if mount

        const portalId = `pid-${portalIdCounter++}`;
        props['portal:id'] = portalId;

        // Create the portal content
        const portalContent = tag(props, ...children);
        van.add(targetElement, hasShowWhenProperty(props) ? showHandler(portalContent, props, _undefined, false) : portalContent);

        // Create a unique comment node as a placeholder
        // Return the comment node as the placeholder
        return _document.createComment(portalId);
      }) as ControlFlowHandler,
      { a: [directives.p.m] }
    ),
    // Show
    s: objectAssign(showHandler as ControlFlowHandler, { a: [directives.s.f, directives.s.w] })
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
  function h(type: string, props?: Props & PropsWithKnownKeys<Element>, ...children: ChildDom[]): Element | string {
    let tag: TagFunc<Element> = van.tags[type];

    const decodedChildren = __HTML_ENTITY_DECODING__
      ? children?.map((child: ChildDom) => (isTypeOfString(child) ? decode!(child) : child))
      : children;

    if (props) {
      if (__CONTROL_FLOWS__) {
        for (let [_, controlFlow] of objectEntries(controlFlows) as [string, ControlFlow][]) {
          if (controlFlow.a.some((attribute) => objectHas(props, attribute))) {
            return controlFlow(tag, props, decodedChildren);
          }
        }
      }

      return tag(props, ...decodedChildren);
    }

    return tag(...decodedChildren);
  }

  let toReturn: VanHTM = { html: htm.bind(h) };

  if (__CONTROL_FLOWS__) {
    /**
     * Removes portal elements from the DOM based on portal IDs found in comments.
     *
     * @param {Node} parent - The parent node to search for portal comment IDs.
     * @param {Element} [portalTarget] - Optional target element to search for portal elements. Defaults to document.body if not provided.
     */
    toReturn.rmPortals = (parent: Node, portalTarget: Element = _document.body): void => {
      const result: string[] = [];
      for (let child = parent.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === Node.COMMENT_NODE && (child as Comment).data.startsWith('pid-')) {
          result.push((child as Comment).data);
        }
      }

      result.forEach((portalId) => {
        // Find and remove the portaled element with attribute portal:id === portalId
        portalTarget.querySelector(`[portal\\:id="${portalId}"]`)?.remove();
      });
    };
  }

  return toReturn;
};

export default vanHTM;
