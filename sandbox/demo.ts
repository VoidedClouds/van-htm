import htm from 'htm';
import van from 'vanjs-core';
import * as vanX from 'vanjs-ext';
import { decode } from 'html-entities';
import vanHTM from 'vanjs-htm';

// Initialize vanHTM
const { html, rmPortals } = vanHTM({ htm, van, vanX, decode });

// Export for use in other modules
export { html, rmPortals, van, vanX };

// Basic HTML Rendering Demo
export function setupBasicHTML(container: HTMLElement) {
  const basicExample = html`
    <div>
      <h3>
        Hello,
        <b>VanHTM</b>
        !
      </h3>
      <p>This is a basic example with nested elements.</p>
      <button onclick=${() => alert('Button clicked!')}>Click Me</button>
    </div>
  `;
  van.add(container, basicExample);
}

// Reactive State Demo
export function setupReactiveState(container: HTMLElement) {
  const count = van.state(0);
  const name = van.state('World');

  const reactiveExample = html`
    <div>
      <h3>Hello, ${name}!</h3>
      <p>Count: ${count}</p>
      <button onclick=${() => count.val++}>Increment</button>
      <button onclick=${() => count.val--}>Decrement</button>
      <br />
      <input
        type="text"
        value=${name}
        oninput=${(e: Event) => (name.val = (e.target as HTMLInputElement).value)}
        placeholder="Enter your name"
      />
    </div>
  `;
  van.add(container, reactiveExample);
}

// for:each Directive Demo
export function setupForEach(container: HTMLElement) {
  const items = vanX.reactive(['Apple', 'Banana', 'Cherry']);

  const randomItems = [
    'Orange',
    'Strawberry',
    'Grape',
    'Pineapple',
    'Mango',
    'Watermelon',
    'Peach',
    'Pear',
    'Kiwi',
    'Blueberry',
    'Raspberry',
    'Coconut',
    'Avocado',
    'Tomato',
    'Carrot',
    'Broccoli',
    'Spinach',
    'Potato'
  ];

  const addRandomItem = () => {
    const randomIndex = Math.floor(Math.random() * randomItems.length);
    items.push(randomItems[randomIndex]);
  };

  const forEachExample = html`
    <div>
      <h3>Shopping List</h3>
      <button onclick=${addRandomItem}>Add Random Item</button>
      <button
        onclick=${() => {
          const item = prompt('Add custom item:');
          if (item) items.push(item);
        }}
      >
        Add Custom Item
      </button>
      <button onclick=${() => items.pop()}>Remove Last</button>
      <button onclick=${() => items.splice(0, items.length)}>Clear All</button>

      <ul for:each=${items}>
        ${(item: any, deleter: () => void, index: number) => html`
          <li>
            ${index}: ${item}
            <button onclick=${deleter} style="float: right;">×</button>
          </li>
        `}
      </ul>
    </div>
  `;
  van.add(container, forEachExample);
}

// show:when Directive Demo
export function setupShowWhen(container: HTMLElement) {
  const visible = van.state(true);

  const showWhenExample = html`
    <div>
      <h3>Conditional Rendering</h3>
      <button onclick=${() => (visible.val = !visible.val)}>Toggle Visibility</button>

      <div show:when=${visible} show:fallback="Content is hidden!">
        <p style="color: green;">✓ This content is visible!</p>
      </div>
    </div>
  `;
  van.add(container, showWhenExample);
}

// portal:mount Directive Demo
export function setupPortal(container: HTMLElement, portalTarget: HTMLElement) {
  const portals: HTMLElement[] = [];

  const createPortal = () => {
    const portalId = Date.now();
    const portalContainer = document.createElement('div');
    portalContainer.className = 'portal-container';

    const removeThisPortal = () => {
      // Remove the portaled content from the target
      console.log(portalContainer, portalTarget);
      rmPortals(portalContainer, portalTarget);
      // Remove the container from DOM
      portalContainer.remove();
      // Remove from tracking array
      const index = portals.indexOf(portalContainer);
      if (index > -1) portals.splice(index, 1);
    };

    const portalContent = html`
      <div style="padding: 10px; background: #f0f0f0; margin-bottom: 10px;">Normal content in container ${portalId}</div>
      <div portal:mount=${portalTarget} style="background: lightblue; padding: 10px; margin: 5px 0; border-radius: 4px;">
        <strong>Portal ${portalId}!</strong>
        Created at: ${new Date().toLocaleTimeString()}
      </div>
      <button onclick=${removeThisPortal}>Remove This Portal</button>
    `;

    van.add(portalContainer, portalContent);
    van.add(container, portalContainer);
    portals.push(portalContainer);
  };

  const portalExample = html`
    <div>
      <h3>Portal Demo</h3>
      <p style="margin: 10px 0; color: #666;">
        Click "Create New Portal" to add content that renders in the portal target below. Each portal can be removed individually or all at
        once.
      </p>
      <button onclick=${createPortal}>Create New Portal</button>
      <button
        onclick=${() => {
          // Remove all portals
          portals.forEach((portalContainer) => {
            rmPortals(portalContainer, portalTarget);
            portalContainer.remove();
          });
          portals.length = 0;
        }}
      >
        Remove All Portals
      </button>
      <div style="margin-top: 20px;">
        <h4>Created Portals:</h4>
      </div>
    </div>
  `;
  van.add(container, portalExample);
}

// SVG Support Demo
export function setupSVG(container: HTMLElement) {
  const radius = van.state(30);
  const showSvgAnimation = van.state(false);
  const showFilter = van.state(false);

  const svgExample = html`
    <div>
      <h3>SVG Examples</h3>

      <h4>Basic SVG (Auto-namespaced)</h4>
      <svg width="100" height="100">
        <circle cx="50" cy="50" r=${radius} fill="lightblue" stroke="darkblue" stroke-width="2" />
        <text x="50" y="55" text-anchor="middle" fill="darkblue">SVG</text>
      </svg>

      <h4>Interactive SVG</h4>
      <input
        type="range"
        min="10"
        max="45"
        value=${radius}
        oninput=${(e: Event) => (radius.val = parseInt((e.target as HTMLInputElement).value))}
      />
      <span>Radius: ${radius}</span>

      <h4>Animation with vh:svg directive (for excluded elements)</h4>
      <button onclick=${() => (showSvgAnimation.val = !showSvgAnimation.val)}>Toggle Animation</button>

      <div show:when=${showSvgAnimation}>
        <svg width="200" height="100">
          <rect x="10" y="10" width="30" height="30" fill="green">
            <animate vh:svg attributeName="x" from="10" to="160" dur="2s" repeatCount="indefinite" />
          </rect>
        </svg>
      </div>

      <h4>Filter Effects with vh:svg directive</h4>
      <button onclick=${() => (showFilter.val = !showFilter.val)}>Toggle Filter Example</button>

      <div show:when=${showFilter}>
        <svg width="200" height="100">
          <defs>
            <filter id="blur">
              <feGaussianBlur vh:svg in="SourceGraphic" stdDeviation="3" />
            </filter>
          </defs>
          <rect x="10" y="10" width="180" height="80" fill="orange" filter="url(#blur)" />
          <text x="100" y="55" text-anchor="middle" fill="white" filter="url(#blur)">Blurred Text</text>
        </svg>
      </div>
    </div>
  `;
  van.add(container, svgExample);
}

// Combined Directives Demo
export function setupCombined(container: HTMLElement) {
  const combinedItems = vanX.reactive(['Item 1', 'Item 2', 'Item 3']);
  const showList = van.state(true);

  const combinedExample = html`
    <div>
      <h3>Combined for:each + show:when</h3>
      <button onclick=${() => (showList.val = !showList.val)}>Toggle List</button>
      <button onclick=${() => combinedItems.push(`Item ${combinedItems.length + 1}`)}>Add Item</button>

      <ul for:each=${combinedItems} show:when=${showList} show:fallback="List is hidden">
        ${(item: any) =>
          html`
            <li>${item}</li>
          `}
      </ul>
    </div>
  `;
  van.add(container, combinedExample);
}

// Regular JavaScript Array.map() Demo
export function setupArrayMap(container: HTMLElement) {
  // Static array
  const staticColors = ['Red', 'Green', 'Blue', 'Yellow', 'Purple'];
  const arrayMapExample = html`
    <div>
      <h3>Regular JavaScript Array.map()</h3>

      <h4>Static Array Mapping</h4>
      <p>Simple color list using array.map():</p>
      <ul>
        ${staticColors.map(
          (color, index) => html`
            <li style="color: ${color.toLowerCase()};">${index + 1}. ${color}</li>
          `
        )}
      </ul>

      <h4>Nested Arrays</h4>
      <div>
        ${[
          { category: 'Fruits', items: ['Apple', 'Banana', 'Orange'] },
          { category: 'Vegetables', items: ['Carrot', 'Broccoli', 'Spinach'] }
        ].map(
          (group) => html`
            <div style="margin: 10px 0;">
              <h5>${group.category}</h5>
              <ul style="margin: 5px 0;">
                ${group.items.map(
                  (item) =>
                    html`
                      <li>${item}</li>
                    `
                )}
              </ul>
            </div>
          `
        )}
      </div>
    </div>
  `;
  van.add(container, arrayMapExample);
}

// HTML Entity Decoding Demo
export function setupEntityDecoding(container: HTMLElement) {
  const entityExample = html`
    <div>
      <h3>HTML Entities</h3>
      <p>Entities in template: &amp; &lt; &gt; &quot; &apos; &nbsp;</p>
      <p>Unicode: Hello 👋 World 🌍</p>
      <p>Special chars: © ® ™ ½ ¼ ¾</p>
    </div>
  `;
  van.add(container, entityExample);
}
