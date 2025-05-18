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

type ControlFlowHandler = (tag: TagFunc<Element>, props: Props, children: ChildDom[]) => any;
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

  let extractProperty = (object: Props, key: string): any => {
    let value = object[key];
    delete object[key];
    return value;
  };
  let { assign: objectAssign, entries: objectEntries, hasOwn: objectHas } = Object;
  let isInstanceOf = (object, constructor) => object instanceof constructor;
  let _Function = Function;

  let directives = {
    f: { e: 'for:each' },
    p: { m: 'portal:mount' },
    s: { f: 'show:fallback', w: 'show:when' }
  };

  let portalIdCounter = 0;
  let controlFlows: Record<string, ControlFlow> = {
    f: objectAssign(
      ((tag: TagFunc<Element>, props: Props, children: ChildDom[]) => {
        let forEach = extractProperty(props, directives.f.e);
        return vanX.list(tag(props), forEach, ...children);
      }) as ControlFlowHandler,
      { a: [directives.f.e] }
    ),
    p: objectAssign(
      ((tag: TagFunc<Element>, props: Props, children: ChildDom[]) => {
        const mount = extractProperty(props, directives.p.m);
        // Determine the target element from the 'mount' prop
        let targetElement: Element | null =
          typeof mount === 'string' // If mount is a string, assume it's a CSS selector
            ? document.querySelector(mount)
            : isInstanceOf(mount, Element)
            ? mount
            : null; // Otherwise, use mount directly if mount is already a DOM element or null

        const portalId = `pid-${portalIdCounter++}`;
        props['portal:id'] = portalId;

        // Create the portal content
        van.add(targetElement, tag(props, ...children));

        // Create a unique comment node as a placeholder
        const comment = document.createComment(portalId);

        // Return the comment node as the placeholder
        return comment;
      }) as ControlFlowHandler,
      { a: [directives.p.m] }
    ),
    s: objectAssign(
      ((tag: TagFunc<Element>, props: Props, children: ChildDom[]) => {
        let fallback = extractProperty(props, directives.s.f) ?? '';
        let when = extractProperty(props, directives.s.w);

        return () => {
          let condition =
            when?.val !== undefined // Check for .val (state)
              ? when.val
              : isInstanceOf(when, _Function)
              ? when()
              : when; // Otherwise, execute if it's a function or use directly

          return condition ? tag(props, ...children) : isInstanceOf(fallback, _Function) ? fallback() : fallback;
        };
      }) as ControlFlowHandler,
      { a: [directives.s.f, directives.s.w] }
    )
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
      ? children?.map((child: ChildDom) => (typeof child === 'string' ? decode!(child) : child))
      : children;

    if (props) {
      if (__CONTROL_FLOWS__) {
        for (let [_, controlFlow] of objectEntries(controlFlows) as [string, ControlFlow][]) {
          if (controlFlow.a.some((attribute) => objectHas(props, attribute))) {
            return controlFlow(tag, props, decodedChildren);
          }
        }
      }

      return tag(props, decodedChildren);
    }

    return tag(decodedChildren);
  }

  let toReturn: VanHTM = { html: htm.bind(h) };

  if (__CONTROL_FLOWS__) {
    const findPortalIds = (parent: Node): string[] => {
      const result: string[] = [];
      for (let child = parent.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === Node.COMMENT_NODE && (child as Comment).data.startsWith('pid-')) {
          result.push((child as Comment).data);
        }
      }

      return result;
    };

    /**
     * Removes portal elements from the DOM based on portal IDs found in comments.
     *
     * @param {Node} parent - The parent node to search for portal comment IDs.
     * @param {Element} [portalTarget] - Optional target element to search for portal elements. Defaults to document.body if not provided.
     */
    toReturn.rmPortals = (parent: Node, portalTarget: Element = document.body): void => {
      findPortalIds(parent).forEach((portalId) => {
        // Find and remove all elements with attribute portal:id === portalId
        portalTarget.querySelectorAll(`[portal\\:id="${portalId}"]`).forEach((el) => el.remove());
      });
    };
  }

  return toReturn;
};

export default vanHTM;
