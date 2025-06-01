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

describe('SVG Support', function () {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders a simple SVG element', () => {
    const el = html`
      <svg width="100" height="100">
        <circle cx="50" cy="50" r="40" fill="red" />
      </svg>
    `;
    container.appendChild(el as Node);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    
    const circle = svg?.querySelector('circle');
    expect(circle).toBeTruthy();
    expect(circle?.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('renders complex SVG with multiple elements', () => {
    const el = html`
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="gradient">
            <stop offset="0%" stop-color="red" />
            <stop offset="100%" stop-color="blue" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="180" height="180" fill="url(#gradient)" />
        <g transform="translate(100, 100)">
          <path d="M 0 -50 L 43.3 25 L -43.3 25 Z" fill="yellow" />
          <text y="10" text-anchor="middle">Star</text>
        </g>
      </svg>
    `;
    container.appendChild(el as Node);
    
    const svg = container.querySelector('svg');
    expect(svg?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    
    // Check various SVG elements
    const elements = ['defs', 'linearGradient', 'stop', 'rect', 'g', 'path', 'text'];
    elements.forEach(tag => {
      const el = svg?.querySelector(tag);
      expect(el).toBeTruthy();
      expect(el?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });
  });

  it('renders SVG with dynamic properties', () => {
    const radius = van.state(30);
    const color = van.state('green');
    
    const el = html`
      <svg width="100" height="100">
        <circle cx="50" cy="50" r=${radius} fill=${color} />
      </svg>
    `;
    container.appendChild(el as Node);
    
    const circle = container.querySelector('circle');
    expect(circle?.getAttribute('r')).toBe('30');
    expect(circle?.getAttribute('fill')).toBe('green');
  });

  it('renders SVG within HTML elements', () => {
    const el = html`
      <div class="icon-container">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor" />
        </svg>
        <span>Icon Label</span>
      </div>
    `;
    container.appendChild(el as Node);
    
    const svg = container.querySelector('svg');
    expect(svg?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    
    const path = svg?.querySelector('path');
    expect(path?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    
    expect(container.querySelector('span')?.textContent).toBe('Icon Label');
  });

  it('renders SVG with for:each directive', () => {
    const points = vanX.reactive([
      { x: 10, y: 10 },
      { x: 30, y: 30 },
      { x: 50, y: 20 }
    ]);
    
    const el = html`
      <svg width="100" height="100">
        <g for:each=${points}>
          ${(point) => html`<circle cx=${point.val.x} cy=${point.val.y} r="5" fill="blue" />`}
        </g>
      </svg>
    `;
    container.appendChild(el as Node);
    
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);
    circles.forEach(circle => {
      expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });
  });

  it('renders SVG with show:when directive', async () => {
    const showCircle = van.state(true);
    
    const el = html`
      <svg width="100" height="100">
        <rect x="25" y="25" width="50" height="50" fill="gray" />
        <circle show:when=${showCircle} cx="50" cy="50" r="20" fill="red" />
      </svg>
    `;
    container.appendChild(el as Node);
    
    expect(container.querySelector('circle')).toBeTruthy();
    
    showCircle.val = false;
    await promisedTimeout();
    expect(container.querySelector('circle')).toBeFalsy();
    
    const rect = container.querySelector('rect');
    expect(rect?.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('renders nested SVG elements correctly', () => {
    const el = html`
      <svg width="200" height="200">
        <g id="outer">
          <g id="inner">
            <rect x="10" y="10" width="50" height="50" />
            <circle cx="100" cy="100" r="30" />
          </g>
        </g>
      </svg>
    `;
    container.appendChild(el as Node);
    
    const outerG = container.querySelector('#outer');
    const innerG = container.querySelector('#inner');
    const rect = container.querySelector('rect');
    const circle = container.querySelector('circle');
    
    [outerG, innerG, rect, circle].forEach(el => {
      expect(el).toBeTruthy();
      expect(el?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });
  });

  describe('vh:svg directive', () => {
    it('forces SVG namespace for excluded animation elements', () => {
      const el = html`
        <svg width="100" height="100">
          <rect x="10" y="10" width="80" height="80" fill="blue">
            <animate vh:svg=${true} attributeName="opacity" from="1" to="0" dur="2s" repeatCount="indefinite" />
          </rect>
        </svg>
      `;
      container.appendChild(el as Node);
      
      const animate = container.querySelector('animate');
      expect(animate).toBeTruthy();
      expect(animate?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    it('forces SVG namespace for excluded filter elements', () => {
      const el = html`
        <svg width="100" height="100">
          <defs>
            <filter id="blur">
              <feGaussianBlur vh:svg=${true} in="SourceGraphic" stdDeviation="5" />
            </filter>
          </defs>
          <rect x="10" y="10" width="80" height="80" fill="red" filter="url(#blur)" />
        </svg>
      `;
      container.appendChild(el as Node);
      
      const feGaussianBlur = container.querySelector('feGaussianBlur');
      expect(feGaussianBlur).toBeTruthy();
      expect(feGaussianBlur?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    it('forces SVG namespace for other excluded elements', () => {
      const el = html`
        <svg width="100" height="100">
          <metadata vh:svg=${true}>Test metadata</metadata>
          <switch vh:svg=${true}>
            <rect x="10" y="10" width="80" height="80" fill="green" />
          </switch>
        </svg>
      `;
      container.appendChild(el as Node);
      
      const metadata = container.querySelector('metadata');
      const switchEl = container.querySelector('switch');
      
      expect(metadata).toBeTruthy();
      expect(metadata?.namespaceURI).toBe('http://www.w3.org/2000/svg');
      
      expect(switchEl).toBeTruthy();
      expect(switchEl?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    it('can override HTML namespace with vh:svg for shared tags', () => {
      const el = html`
        <svg width="100" height="100">
          <a vh:svg=${true} href="#test">
            <text x="50" y="50">Click me</text>
          </a>
        </svg>
      `;
      container.appendChild(el as Node);
      
      const anchor = container.querySelector('a');
      expect(anchor).toBeTruthy();
      expect(anchor?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });
  });

  describe('shared HTML/SVG tags', () => {
    it('renders <a> as HTML element by default outside SVG', () => {
      const el = html`
        <div>
          <a href="#test">HTML Link</a>
        </div>
      `;
      container.appendChild(el as Node);
      
      const anchor = container.querySelector('a');
      expect(anchor).toBeTruthy();
      expect(anchor?.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    });

    it('renders <title> as HTML element by default', () => {
      const el = html`
        <div>
          <title>HTML Title</title>
        </div>
      `;
      container.appendChild(el as Node);
      
      const title = container.querySelector('title');
      expect(title).toBeTruthy();
      expect(title?.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    });

    it('renders <style> as HTML element by default', () => {
      const el = html`
        <div>
          <style>.test { color: red; }</style>
        </div>
      `;
      container.appendChild(el as Node);
      
      const style = container.querySelector('style');
      expect(style).toBeTruthy();
      expect(style?.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    });

    it('renders <script> as HTML element by default', () => {
      const el = html`
        <div>
          <script>console.log('test');</script>
        </div>
      `;
      container.appendChild(el as Node);
      
      const script = container.querySelector('script');
      expect(script).toBeTruthy();
      expect(script?.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    });

    it('can force shared tags to SVG namespace when needed', () => {
      const el = html`
        <svg width="100" height="100">
          <title vh:svg=${true}>SVG Title</title>
          <style vh:svg=${true}>.svg-style { fill: blue; }</style>
        </svg>
      `;
      container.appendChild(el as Node);
      
      const title = container.querySelector('title');
      const style = container.querySelector('style');
      
      expect(title).toBeTruthy();
      expect(title?.namespaceURI).toBe('http://www.w3.org/2000/svg');
      
      expect(style).toBeTruthy();
      expect(style?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });
  });
});