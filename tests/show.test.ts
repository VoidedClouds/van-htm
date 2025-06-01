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
  // van-htm
  html
} from './utils';

describe('show:when directive', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('without reactivity', () => {
    it('renders when condition is true', () => {
      const el = html`
        <div show:when=${true}>Visible</div>
      `;
      container.append((el as Function)());
      expect(container.textContent).toBe('Visible');
    });

    it('renders when condition is true from Function', () => {
      const el = html`
        <div show:when=${() => true}>Visible</div>
      `;
      container.append((el as Function)());
      expect(container.textContent).toBe('Visible');
    });

    it('renders fallback when condition is false', () => {
      const el = html`
        <div show:when=${false} show:fallback=${() => 'Hidden'}>Visible</div>
      `;
      container.append((el as Function)());
      expect(container.textContent).toBe('Hidden');
    });

    it('renders nothing when condition is false and no fallback', () => {
      const el = html`
        <div show:when=${false}>Visible</div>
      `;
      container.append((el as Function)());
      expect(container.textContent).toBe('');
    });

    it('renders fallback when show:when is 0', () => {
      const el = html`
        <div show:when=${0} show:fallback="Zero">Visible</div>
      `;
      container.append((el as Function)());
      expect(container.textContent).toBe('Zero');
    });

    it('renders fallback when show:when is empty string', () => {
      const el = html`
        <div show:when=${''} show:fallback="Empty">Visible</div>
      `;
      container.append((el as Function)());
      expect(container.textContent).toBe('Empty');
    });

    it('renders fallback when show:when is null', () => {
      const el = html`
        <div show:when=${null} show:fallback="Null">Visible</div>
      `;
      container.append((el as Function)());
      expect(container.textContent).toBe('Null');
    });

    it('renders fallback when show:when is undefined', () => {
      const el = html`
        <div show:when=${undefined} show:fallback="Undefined">Visible</div>
      `;
      container.append((el as Function)());
      expect(container.textContent).toBe('Undefined');
    });
  });

  describe('with reactivity', () => {
    it('toggles between visible and fallback using van.state', async () => {
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