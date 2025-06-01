import { defineConfig, type Options } from 'tsup';
import { Plugin } from 'esbuild';
import fs from 'fs';

interface BundleOptions {
  dev?: boolean;
  node?: boolean;
  // Code Paths
  htmlEntityDecoding?: boolean;
}

function options({ dev, htmlEntityDecoding = false, node }: BundleOptions): Options {
  const plugin: Plugin = {
    name: 'remove-console-warn',
    setup(build) {
      if (dev) return;
      const filter = /\.[jt]sx?$/;
      build.onLoad({ filter }, async (args) => {
        try {
          let source = await fs.promises.readFile(args.path, 'utf8');
          // Remove console.warn statements and replace const/var with let
          source = source.replace(/console\.warn\s*\(\s*(?:[^)(]|\([^)(]*\))*\)\s*;?/g, '').replace(/\b(var|const)\b/g, 'let');
          return {
            contents: source,
            loader: args.path.endsWith('.tsx') ? 'tsx' : args.path.endsWith('.jsx') ? 'jsx' : args.path.endsWith('.ts') ? 'ts' : 'js'
          };
        } catch (error) {
          return { errors: [{ text: `Failed to process ${args.path}: ${error}` }] };
        }
      });
    }
  };

  // Determine output directory
  let outDir = 'dist';

  if (htmlEntityDecoding === true) {
    outDir = 'dist/withDecoding';
  }

  return {
    bundle: true,
    clean: true,
    entry: {
      [node ? 'van-htm' : dev ? 'van-htm.dev' : 'van-htm']: 'src/index.ts'
    },
    outExtension({ format }) {
      return {
        js: format === 'iife' ? `.js` : format === 'esm' ? `.module.js` : `.cjs`
      };
    },
    external: [],
    format: node ? 'cjs' : ['esm', 'iife'],
    globalName: node ? undefined : 'vanHTM',
    outDir,
    treeshake: true,
    minify: dev ? false : true,
    define: {
      __DEV__: dev ? 'true' : 'false',
      __TEST__: 'false',
      // Code Paths
      __HTML_ENTITY_DECODING__: htmlEntityDecoding ? 'true' : 'false'
    },
    platform: node ? 'node' : 'browser',
    target: node ? 'node16' : 'esnext',
    esbuildOptions(opts) {
      opts.mangleProps = !dev ? /^_/ : undefined;
    },
    esbuildPlugins: [plugin]
  };
}

export default defineConfig([
  // Dev builds
  options({ dev: true, htmlEntityDecoding: false }), // dev
  options({ dev: true, htmlEntityDecoding: true }), // dev-withDecoding

  // Prod builds
  options({ dev: false, htmlEntityDecoding: false }), // prod
  options({ dev: false, htmlEntityDecoding: true }), // prod-withDecoding

  // Node build
  options({ node: true, htmlEntityDecoding: false }), // server
  options({ node: true, htmlEntityDecoding: true }) // server-withDecoding
]);
