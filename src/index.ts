import type htm from 'htm';
import type { ChildDom, Props, PropsWithKnownKeys, State, TagFunc, Van } from 'vanjs-core';
import type { KeyType, ValueType, list } from 'vanjs-ext';

export type { ChildDom, Van, htm, list };

export type VanHTMOptions = {
  htm: typeof htm;
  van: Pick<Van, 'add' | 'tags'>;
  vanX: {
    list: typeof list;
  };
  decode?: (input: string) => string;
};

export type VanHTM = {
  html: (template: TemplateStringsArray, ...substitutions: unknown[]) => ChildDom;
  rmPortals: (parent: Node, portalTarget?: Element | string) => void;
};

export type LoopItemRenderer<T extends object> = (v: State<ValueType<T>>, deleter: () => void, k: KeyType<T>) => Node;

const vanHTM = (options: VanHTMOptions): VanHTM => {
  const { htm, van, vanX } = options;
  let decode: ((input: string) => string) | undefined;

  if (__HTML_ENTITY_DECODING__) {
    decode = options?.decode;
  }

  const _document = document;
  const _undefined = undefined;

  const objectHasOwn = Object.hasOwn;
  const isFunctionInstance = (object: unknown): object is Function => object instanceof Function;
  const isTypeOfString = (value: unknown): value is string => typeof value === 'string';

  const directives = {
    f: { e: 'for:each' as const },
    p: { m: 'portal:mount' as const },
    s: { f: 'show:fallback' as const, w: 'show:when' as const }
  } as const;

  type DirectiveKeys = {
    'portal:mount': Element | string;
    'show:fallback': ChildDom;
    'show:when': boolean | (() => boolean) | State<boolean>;
  };

  type DirectiveKeysWithType<T extends object> = {
    'for:each': T;
  };

  type PropsWithDirectives = Props &
    PropsWithKnownKeys<Element> &
    Partial<DirectiveKeys> & {
      'p:id'?: string;
    };

  type PropsWithDirectivesWithType<T extends object> = PropsWithDirectives & Partial<DirectiveKeysWithType<T>>;

  const extractProperty = <T>(object: PropsWithDirectives, key: string): T => {
    const value = object[key] as T;
    delete object[key];
    return value;
  };

  const hasShowWhenProperty = (props: PropsWithDirectives): boolean => objectHasOwn(props, directives.s.w);

  const handleShow = (
    fnOrNode: TagFunc<Element> | (() => ChildDom) | ChildDom,
    props: PropsWithDirectives,
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
  const handleFor = <T extends object>(
      tag: TagFunc<Element>,
      props: PropsWithDirectivesWithType<T>,
      renderer: LoopItemRenderer<T>
    ): ChildDom => {
      const items = extractProperty<T>(props, directives.f.e);
      const listFn = () => vanX.list(tag(props), items, renderer);

      return hasShowWhenProperty(props) ? handleShow(listFn, props as PropsWithDirectives, _undefined, false) : listFn();
    },
    handlePortal = (tag: TagFunc<Element>, props: PropsWithDirectives, children: ChildDom[]): Comment => {
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

  function h<T extends object>(
    this: [number, ...unknown[]],
    type: string,
    props?: PropsWithDirectivesWithType<T> | null | undefined,
    ...children: (ChildDom | LoopItemRenderer<T>)[]
  ): ChildDom {
    // Disable caching of created elements https://github.com/developit/htm/#caching
    this[0] = 3;

    const tag = van.tags[type];
    const decodedChildren = __HTML_ENTITY_DECODING__
      ? children?.map((child) => (isTypeOfString(child) ? decode!(child) : child))
      : children;

    // If attributes/properties have been passed to the element, check for Control Flow Directives
    if (props) {
      if (objectHasOwn(props, directives.f.e)) {
        return handleFor(tag, props, decodedChildren[0] as LoopItemRenderer<T>);
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
    /**
     * Removes portal elements from the DOM based on portal IDs found in comments.
     *
     * @param {Node} parent - The parent node to search for portal comment IDs.
     * @param {Element | string} [portalTarget] - Optional target element to search for portal elements. Defaults to document.body if not provided.
     */
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
