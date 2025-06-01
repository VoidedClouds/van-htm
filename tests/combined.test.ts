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
  html,
  rmPortals
} from './utils';

describe('Combined directives', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('combining show with for', () => {
    it('renders fallback when show:when is false', async () => {
      const items = vanX.reactive([1, 2]);
      const visible = van.state(false);
      const el = html`
        <ul for:each=${items} show:when=${visible} show:fallback="No items">
          ${(v) =>
            html`
              <li>${v}</li>
            `}
        </ul>
      `;
      van.add(container, el);

      expect(container.textContent).toBe('No items');

      visible.val = true;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(2);
    });

    it('renders nothing when show:when is false and no fallback', async () => {
      const items = vanX.reactive([1]);
      const visible = van.state(false);
      const el = html`
        <ul for:each=${items} show:when=${visible}>
          ${(v) =>
            html`
              <li>${v}</li>
            `}
        </ul>
      `;
      van.add(container, el);

      expect(container.textContent).toBe('');
    });

    it('shows and hides the entire list when toggling show:when', async () => {
      const items = vanX.reactive([1, 2, 3]);
      const visible = van.state(true);
      const el = html`
        <ul for:each=${items} show:when=${visible}>
          ${(v) =>
            html`
              <li>${v}</li>
            `}
        </ul>
      `;
      van.add(container, el);

      expect(container.querySelectorAll('li').length).toBe(3);

      visible.val = false;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(0);

      visible.val = true;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(3);
    });

    it('updates list after toggling visibility', async () => {
      const items = vanX.reactive([1, 2]);
      const visible = van.state(true);
      const el = html`
        <ul for:each=${items} show:when=${visible}>
          ${(v) =>
            html`
              <li>${v}</li>
            `}
        </ul>
      `;
      van.add(container, el);

      // Initially visible
      expect(container.querySelectorAll('li').length).toBe(2);
      expect(container.textContent).toBe('12');

      // Hide the list
      visible.val = false;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(0);

      // Show the list again
      visible.val = true;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(2);
      expect(container.textContent).toBe('12');

      // Mutate the list
      items.push(3, 4);
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(4);
      expect(container.textContent).toBe('1234');

      // Hide the list
      visible.val = false;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(0);

      // Show the list again
      visible.val = true;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(4);
      expect(container.textContent).toBe('1234');

      // Mutate the list
      items.push(5, 6, 7);
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(7);
      expect(container.textContent).toBe('1234567');

      // Hide the list
      visible.val = false;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(0);

      // Show the list again
      visible.val = true;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(7);
      expect(container.textContent).toBe('1234567');
    });

    it('updates list while hidden in between toggling visibility', async () => {
      const items = vanX.reactive([1, 2]);
      const visible = van.state(true);
      const el = html`
        <ul for:each=${items} show:when=${visible}>
          ${(v) =>
            html`
              <li>${v}</li>
            `}
        </ul>
      `;
      van.add(container, el);

      // Initially visible
      expect(container.querySelectorAll('li').length).toBe(2);
      expect(container.textContent).toBe('12');

      // Hide the list
      visible.val = false;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(0);

      // Mutate the list while hidden
      items.push(3, 4);
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(0);

      // Show the list with mutated data
      visible.val = true;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(4);
      expect(container.textContent).toBe('1234');

      // Hide the list
      visible.val = false;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(0);

      // Mutate the list while hidden
      items.push(5, 6, 7);
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(0);

      // Show the list with mutated data
      visible.val = true;
      await promisedTimeout();
      expect(container.querySelectorAll('li').length).toBe(7);
      expect(container.textContent).toBe('1234567');
    });
  });

  describe('combining show with portal', () => {
    let portalTarget: HTMLElement;

    beforeEach(() => {
      portalTarget = document.createElement('div');
      portalTarget.id = 'portal-target-combo';
      document.body.appendChild(portalTarget);
    });

    afterEach(() => {
      portalTarget.remove();
    });

    it('shows and hides portaled content when toggling show:when and updates content in between', async () => {
      const showPortalContent = van.state('PortaledShow');
      const visible = van.state(true);
      const el = html`
        <div portal:mount="#portal-target-combo" show:when=${visible}>${showPortalContent}</div>
      `;
      container.appendChild(el as Node);

      expect(portalTarget.textContent).toBe('PortaledShow');

      visible.val = false;
      await promisedTimeout();
      expect(portalTarget.textContent).toBe('');

      showPortalContent.val = 'PortaledShowUpdated';
      await promisedTimeout();
      expect(portalTarget.textContent).toBe('');

      visible.val = true;
      await promisedTimeout();
      expect(portalTarget.textContent).toBe('PortaledShowUpdated');

      // Remove the portal and verify it is removed
      rmPortals(container, portalTarget);
      expect(portalTarget.textContent).toBe('');
    });

    it('renders fallback in portal when show:when is false', async () => {
      const visible = van.state(false);
      const el = html`
        <div portal:mount="#portal-target-combo" show:when=${visible} show:fallback="HiddenPortal">PortaledShow</div>
      `;
      container.appendChild(el as Node);

      expect(portalTarget.textContent).toBe('HiddenPortal');

      visible.val = true;
      await promisedTimeout();
      expect(portalTarget.textContent).toBe('PortaledShow');

      visible.val = false;
      await promisedTimeout();
      expect(portalTarget.textContent).toBe('HiddenPortal');

      visible.val = true;
      await promisedTimeout();
      expect(portalTarget.textContent).toBe('PortaledShow');

      // Remove the portal and verify it is removed
      rmPortals(container, portalTarget);
      expect(portalTarget.textContent).toBe('');
    });

    it('renders nothing in portal when show:when is false and no fallback', async () => {
      const visible = van.state(false);
      const el = html`
        <div portal:mount="#portal-target-combo" show:when=${visible}>PortaledShow</div>
      `;
      container.appendChild(el as Node);

      expect(portalTarget.textContent).toBe('');

      visible.val = true;
      await promisedTimeout();
      expect(portalTarget.textContent).toBe('PortaledShow');

      // Remove the portal and verify it is removed
      rmPortals(container, portalTarget);
      expect(portalTarget.textContent).toBe('');
    });
  });
});