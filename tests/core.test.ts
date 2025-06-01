import { ChildDom } from 'vanjs-core';
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

describe('Core HTML functionality', function () {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

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