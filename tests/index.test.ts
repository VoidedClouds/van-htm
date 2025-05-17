import { ChildDom } from 'vanjs-core';
import {
  // vitest
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  // utils
  promisedTimeout,
  // van
  van,
  vanX,
  // van-htm
  html,
  rmPortals
} from './utils';

describe('html', function () {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('HTML only', function () {
    it('renders a simple element', () => {
      const el = html`
        <div>Hello</div>
      `;
      container.appendChild(el as Node);
      expect(container.innerHTML).toContain('Hello');
    });

    it('renders nested elements', () => {
      const el = html`
        <div><span>World</span></div>
      `;
      container.appendChild(el as Node);
      expect(container.querySelector('span')!.textContent).toBe('World');
    });

    it('renders with props', () => {
      const el = html`
        <button id="btn" class="primary">Click</button>
      `;
      container.appendChild(el as Node);
      const btn = container.querySelector('#btn');
      expect(btn).not.toBeNull();
      expect(btn?.className).toBe('primary');
      expect(btn?.textContent).toBe('Click');
    });

    it('renders with children', () => {
      const el = html`
        <ul>
          <li>One</li>
          <li>Two</li>
        </ul>
      `;
      container.appendChild(el as Node);
      const items = container.querySelectorAll('li');
      expect(items.length).toBe(2);
      expect(items[0].textContent).toBe('One');
      expect(items[1].textContent).toBe('Two');
    });

    it('supports dynamic values', () => {
      const value = 'Dynamic!';
      const el = html`
        <span>${value}</span>
      `;
      container.appendChild(el as Node);
      expect(container.textContent).toBe('Dynamic!');
    });

    it('renders null/undefined as empty', () => {
      const el = html`
        <div>${null}${undefined}${0}</div>
      `;
      container.appendChild(el as Node);
      expect(container.textContent).toBe('0');
    });
  });

  describe('HTML entities', function () {
    it('decodes HTML entities if enabled', function () {
      if (!(globalThis as any).__HTML_ENTITY_DECODING__) return this?.skip?.();
      const el = html`
        <div>&amp; &lt; &gt; &quot; &apos; &nbsp;</div>
      `;
      container.append(el as Node);
      expect(container.textContent).toBe(`& < > " ' \u00A0`);
    });

    it('does not decode HTML entities if disabled', function () {
      if ((globalThis as any).__HTML_ENTITY_DECODING__) return this?.skip?.();
      const el = html`
        <div>&amp; &lt; &gt; &quot; &apos; &nbsp;</div>
      `;
      container.append(el as Node);
      expect(container.textContent).toBe('&amp; &lt; &gt; &quot; &apos; &nbsp;');
    });
  });

  describe('HTML Control Flows', function () {
    describe('for directive', () => {
      describe('without reactivity', () => {
        it('renders a list of items', () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const items = vanX.reactive([1, 2, 3]);
          const el = html`
            <ul for:each=${items}>
              ${(v, deleter, k) =>
                html`
                  <li>${v}</li>
                `}
            </ul>
          `;
          container.appendChild(el as Node);
          const lis = container.querySelectorAll('li');
          expect(lis.length).toBe(3);
          expect(lis[0].textContent).toBe('1');
          expect(lis[1].textContent).toBe('2');
          expect(lis[2].textContent).toBe('3');
        });

        it('renders empty list', () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const items: any[] = vanX.reactive([]);
          const el = html`
            <ul for:each=${items}>
              ${(v, deleter, k) =>
                html`
                  <li>${v}</li>
                `}
            </ul>
          `;
          container.appendChild(el as Node);
          expect(container.querySelectorAll('li').length).toBe(0);
        });

        it('renders list with objects', () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const items = vanX.reactive([{ name: 'A' }, { name: 'B' }]);
          const el = html`
            <ul for:each=${items}>
              ${(v, deleter, k) =>
                html`
                  <li>${v.val.name}</li>
                `}
            </ul>
          `;
          container.appendChild(el as Node);
          const lis = container.querySelectorAll('li');
          expect(lis.length).toBe(2);
          expect(lis[0].textContent).toBe('A');
          expect(lis[1].textContent).toBe('B');
        });
      });

      describe('with reactivity', () => {
        it('adds 3 items one at a time', async () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const items = vanX.reactive<number[]>([]);
          const el = html`
            <ul for:each=${items}>
              ${(v) =>
                html`
                  <li>${v}</li>
                `}
            </ul>
          `;
          van.add(container, el);

          expect(container.querySelectorAll('li').length).toBe(0);

          items.push(1);
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(1);
          expect(container.textContent).toBe('1');

          items.push(2);
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(2);
          expect(container.textContent).toBe('12');

          items.push(3);
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(3);
          expect(container.textContent).toBe('123');
        });

        it('removes 3 items one at a time', async () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const items = vanX.reactive<number[]>([1, 2, 3]);
          const el = html`
            <ul for:each=${items}>
              ${(v) =>
                html`
                  <li>${v}</li>
                `}
            </ul>
          `;
          van.add(container, el);

          expect(container.querySelectorAll('li').length).toBe(3);

          items.splice(0, 1); // Remove first
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(2);
          expect(container.textContent).toBe('23');

          items.splice(0, 1); // Remove next
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(1);
          expect(container.textContent).toBe('3');

          items.splice(0, 1); // Remove last
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(0);
          expect(container.textContent).toBe('');
        });

        it('adds and removes items reactively', async () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const items = vanX.reactive<number[]>([]);
          const el = html`
            <ul for:each=${items}>
              ${(v) =>
                html`
                  <li>${v}</li>
                `}
            </ul>
          `;
          van.add(container, el);

          // Add items
          items.push(1, 2);
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(2);
          expect(container.textContent).toBe('12');

          // Remove one
          items.splice(0, 1);
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(1);
          expect(container.textContent).toBe('2');

          // Add another
          items.push(3);
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(2);
          expect(container.textContent).toBe('23');

          // Remove all
          items.splice(0, 2);
          await promisedTimeout();
          expect(container.querySelectorAll('li').length).toBe(0);
          expect(container.textContent).toBe('');
        });
      });
    });

    describe('show directive', () => {
      describe('without reactivity', () => {
        it('renders when condition is true', () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();
          const el = html`
            <div show:when=${true}>Visible</div>
          `;
          container.append((el as Function)());
          expect(container.textContent).toBe('Visible');
        });

        it('renders fallback when condition is false', () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const el = html`
            <div show:when=${false} show:fallback=${() => 'Hidden'}>Visible</div>
          `;
          container.append((el as Function)());
          expect(container.textContent).toBe('Hidden');
        });

        it('renders nothing when condition is false and no fallback', () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const el = html`
            <div show:when=${false}>Visible</div>
          `;
          container.append((el as Function)());
          expect(container.textContent).toBe('');
        });
      });

      describe('with reactivity', () => {
        it('toggles between visible and fallback using van.state', async () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const visible = van.state(false);
          const el = html`
            <div show:when=${visible} show:fallback=${() => 'Hidden'}>Visible</div>
          `;
          van.add(container, el);

          // Initially fallback
          expect(container.textContent).toBe('Hidden');

          // Show content
          visible.val = true;
          await promisedTimeout();

          expect(container.textContent).toBe('Visible');

          // Back to fallback
          visible.val = false;
          await promisedTimeout();

          expect(container.textContent).toBe('Hidden');
        });

        it('renders nothing when toggled to false and no fallback', async () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const visible = van.state(true);
          const el = html`
            <div show:when=${visible}>Visible</div>
          `;
          van.add(container, el);

          expect(container.textContent).toBe('Visible');

          visible.val = false;
          await promisedTimeout();

          expect(container.textContent).toBe('');
        });

        it('renders fallback as static string when toggled', async () => {
          if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

          const visible = van.state(false);
          const el = html`
            <div show:when=${visible} show:fallback="Static fallback">Visible</div>
          `;
          van.add(container, el);

          expect(container.textContent).toBe('Static fallback');

          visible.val = true;
          await promisedTimeout();

          expect(container.textContent).toBe('Visible');
        });
      });
    });

    describe('portal directive', () => {
      let portalTarget: HTMLElement;
      let otherContainer: HTMLElement;

      beforeEach(() => {
        portalTarget = document.createElement('div');
        portalTarget.id = 'portal-target';
        document.body.appendChild(portalTarget);

        otherContainer = document.createElement('div');
        document.body.appendChild(otherContainer);
      });

      afterEach(() => {
        portalTarget.remove();
        otherContainer.remove();
      });

      it('mounts content to a target element by selector', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        const el = html`
          <div portal:mount="#portal-target">Portaled</div>
        `;
        // The returned node is a comment, not the actual element
        container.appendChild(el as Node);
        expect(portalTarget.textContent).toBe('Portaled');
      });

      it('mounts content to a target element by element reference', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        const el = html`
          <div portal:mount=${portalTarget}>PortaledRef</div>
        `;
        container.appendChild(el as Node);
        expect(portalTarget.textContent).toBe('PortaledRef');
      });

      it('does not mount if target is null', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        // Expect a TypeError to be thrown when portal:mount is null
        expect(() => {
          const el = html`
            <div portal:mount=${null}>ShouldNotAppear</div>
          `;
          container.appendChild(el as Node);
        }).toThrow(TypeError);
      });

      it('removes portaled elements from the portal target', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        // Mount a portaled element
        const el = html`
          <div portal:mount="#portal-target">Portaled</div>
        `;
        container.appendChild(el as Node);

        // Confirm it's present
        expect(portalTarget.textContent).toBe('Portaled');
        // Remove portaled elements
        rmPortals!(container, portalTarget);
        // Should be gone
        expect(portalTarget.textContent).toBe('');
      });

      it('removes multiple portaled elements', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        const el1 = html`
          <div portal:mount="#portal-target">One</div>
        `;
        const el2 = html`
          <div portal:mount="#portal-target">Two</div>
        `;
        container.appendChild(el1 as Node);
        container.appendChild(el2 as Node);

        expect(portalTarget.textContent).toContain('One');
        expect(portalTarget.textContent).toContain('Two');

        rmPortals!(container, portalTarget);

        expect(portalTarget.textContent).toBe('');
      });

      it('removes only portaled elements for the specified container and portalTarget', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        // Add two portaled elements from different containers
        const el1 = html`
          <div portal:mount="#portal-target">FromContainer</div>
        `;
        const el2 = html`
          <div portal:mount="#portal-target">FromOtherContainer</div>
        `;
        container.appendChild(el1 as Node);
        otherContainer.appendChild(el2 as Node);

        expect(portalTarget.textContent).toContain('FromContainer');
        expect(portalTarget.textContent).toContain('FromOtherContainer');

        // Remove only those belonging to `container`
        rmPortals!(container, portalTarget);

        expect(portalTarget.textContent).not.toContain('FromContainer');
        expect(portalTarget.textContent).toContain('FromOtherContainer');
      });

      it('does not throw if there are no portaled elements', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        // No portaled elements
        expect(() => rmPortals!(container, portalTarget)).not.toThrow();
        expect(portalTarget.textContent).toBe('');
      });

      it('removes portaled elements from document.body if no portalTarget is given', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        const el = html`
          <div portal:mount="#portal-target">Portaled</div>
        `;
        container.appendChild(el as Node);

        expect(portalTarget.textContent).toBe('Portaled');
        rmPortals!(container); // No portalTarget provided
        expect(portalTarget.textContent).toBe('');
      });

      it('removes multiple portaled elements from document.body if no portalTarget is given', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        const el1 = html`
          <div portal:mount="#portal-target">One</div>
        `;
        const el2 = html`
          <div portal:mount="#portal-target">Two</div>
        `;
        container.appendChild(el1 as Node);
        container.appendChild(el2 as Node);

        expect(portalTarget.textContent).toContain('One');
        expect(portalTarget.textContent).toContain('Two');

        rmPortals!(container); // No portalTarget provided

        expect(portalTarget.textContent).toBe('');
      });

      it('removes only portaled elements for the specified container using document.body as default', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        // Add two portaled elements from different containers
        const el1 = html`
          <div portal:mount="#portal-target">FromContainer</div>
        `;
        const el2 = html`
          <div portal:mount="#portal-target">FromOtherContainer</div>
        `;
        container.appendChild(el1 as Node);
        otherContainer.appendChild(el2 as Node);

        expect(portalTarget.textContent).toContain('FromContainer');
        expect(portalTarget.textContent).toContain('FromOtherContainer');

        // Remove only those belonging to `container` (uses document.body)
        rmPortals!(container);

        expect(portalTarget.textContent).not.toContain('FromContainer');
        expect(portalTarget.textContent).toContain('FromOtherContainer');
      });

      it('does not throw if there are no portaled elements and no portalTarget is given', () => {
        if (!(globalThis as any).__CONTROL_FLOWS__) return this?.skip?.();

        expect(() => rmPortals!(container)).not.toThrow();
        expect(portalTarget.textContent).toBe('');
      });
    });
  });
});
