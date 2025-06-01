# VanHTM Interactive Sandbox

This directory contains an interactive demo of VanHTM features.

## Running the Sandbox

From the project root:

```bash
npm run sandbox
```

This will start a Vite server and open the sandbox in your browser.

## Structure

- `index.html` - Main HTML file
- `main.ts` - Entry point that sets up all demos
- `demo.ts` - Contains all the demo implementations
- `styles.css` - Styling for the sandbox
- `vite.config.ts` - Vite configuration

## Features Demonstrated

1. **Basic HTML Rendering** - Simple templates with nested elements
2. **Reactive State** - VanJS state management with two-way binding
3. **for:each Directive** - Dynamic lists with add/remove functionality
4. **show:when Directive** - Conditional rendering with fallback
5. **portal:mount Directive** - Rendering content in different DOM locations
6. **SVG Support** - Automatic namespace handling and vh:svg directive
7. **Combined Directives** - Using multiple directives together
8. **HTML Entity Decoding** - Proper handling of HTML entities

## Development

The sandbox uses TypeScript and hot module reloading for a smooth development experience. Make changes to any file and see them reflected immediately in the browser.
