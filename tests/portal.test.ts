import {
  // vitest
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  // van-htm
  html,
  rmPortals
} from './utils';

describe('portal:mount directive', () => {
  let container: HTMLElement;
  let portalTarget: HTMLElement;
  let portalTargetId = 'portal-target';
  let portalTargetSelector = `#${portalTargetId}`;
  let otherContainer: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    portalTarget = document.createElement('div');
    portalTarget.id = portalTargetId;
    document.body.appendChild(portalTarget);

    otherContainer = document.createElement('div');
    document.body.appendChild(otherContainer);
  });

  afterEach(() => {
    container.remove();
    portalTarget.remove();
    otherContainer.remove();
  });

  it('mounts content to a target element by element reference', () => {
    const el = html`
      <div portal:mount=${portalTarget}>PortaledRef</div>
    `;
    container.appendChild(el as Node);
    expect(portalTarget.textContent).toBe('PortaledRef');
  });

  it('mounts content to a target element by selector', () => {
    const el = html`
      <div portal:mount="#portal-target">Portaled</div>
    `;
    // The returned node is a comment, not the actual element
    container.appendChild(el as Node);
    expect(portalTarget.textContent).toBe('Portaled');
  });

  it('does not mount if target is null', () => {
    // Expect a TypeError to be thrown when portal:mount is null
    expect(() => {
      const el = html`
        <div portal:mount=${null}>ShouldNotAppear</div>
      `;
      container.appendChild(el as Node);
    }).toThrow(TypeError);
  });

  it('removes portaled elements from the portal target', () => {
    // Mount a portaled element
    const el = html`
      <div portal:mount="#portal-target">Portaled</div>
    `;
    container.appendChild(el as Node);

    // Confirm it's present
    expect(portalTarget.textContent).toBe('Portaled');
    // Remove portaled elements
    rmPortals(container, portalTarget);
    // Should be gone
    expect(portalTarget.textContent).toBe('');
  });

  it('removes portaled elements from the portal target by selector', () => {
    // Mount a portaled element
    const el = html`
      <div portal:mount="#portal-target">Portaled</div>
    `;
    container.appendChild(el as Node);

    // Confirm it's present
    expect(portalTarget.textContent).toBe('Portaled');
    // Remove portaled elements
    rmPortals(container, portalTargetSelector);
    // Should be gone
    expect(portalTarget.textContent).toBe('');
  });

  it('removes multiple portaled elements', () => {
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

    rmPortals(container, portalTarget);

    expect(portalTarget.textContent).toBe('');
  });

  it('removes multiple portaled elements by selector', () => {
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

    rmPortals(container, portalTargetSelector);

    expect(portalTarget.textContent).toBe('');
  });

  it('removes only portaled elements for the specified container and portalTarget', () => {
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
    rmPortals(container, portalTarget);

    expect(portalTarget.textContent).not.toContain('FromContainer');
    expect(portalTarget.textContent).toContain('FromOtherContainer');
  });

  it('removes only portaled elements for the specified container and portalTarget by selector', () => {
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
    rmPortals(container, portalTargetSelector);

    expect(portalTarget.textContent).not.toContain('FromContainer');
    expect(portalTarget.textContent).toContain('FromOtherContainer');
  });

  it('does not throw if there are no portaled elements', () => {
    // No portaled elements
    expect(() => rmPortals(container, portalTarget)).not.toThrow();
    expect(portalTarget.textContent).toBe('');
  });

  it('does not throw if there are no portaled elements by selector', () => {
    // No portaled elements
    expect(() => rmPortals(container, portalTargetSelector)).not.toThrow();
    expect(portalTarget.textContent).toBe('');
  });

  it('removes portaled elements from document.body if no portalTarget is given', () => {
    const el = html`
      <div portal:mount="#portal-target">Portaled</div>
    `;
    container.appendChild(el as Node);

    expect(portalTarget.textContent).toBe('Portaled');
    rmPortals(container); // No portalTarget provided
    expect(portalTarget.textContent).toBe('');
  });

  it('removes multiple portaled elements from document.body if no portalTarget is given', () => {
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

    rmPortals(container); // No portalTarget provided

    expect(portalTarget.textContent).toBe('');
  });

  it('removes only portaled elements for the specified container using document.body as default', () => {
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
    rmPortals(container);

    expect(portalTarget.textContent).not.toContain('FromContainer');
    expect(portalTarget.textContent).toContain('FromOtherContainer');
  });

  it('does not throw if there are no portaled elements and no portalTarget is given', () => {
    expect(() => rmPortals(container)).not.toThrow();
    expect(portalTarget.textContent).toBe('');
  });
});