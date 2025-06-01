import {
  // vitest
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  // van-htm
  html
} from './utils';

describe('HTML Entities', function () {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

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