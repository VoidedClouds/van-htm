import {
  // vitest
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  // utils
  promisedTimeout,
  // van
  van,
  vanX,
  // van-htm
  html
} from './utils';

describe('for:each directive', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('without reactivity', () => {
    it('renders a list of items', () => {
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