import { defineConfig, type Options } from 'tsup';
import { Plugin } from 'esbuild';
import fs from 'fs';

interface BundleOptions {
  dev?: boolean;
  node?: boolean;
  // Code Paths
  controlFlows?: boolean;
  htmlEntityDecoding?: boolean;
}

function options({ controlFlows = true, dev, htmlEntityDecoding = false, node }: BundleOptions): Options {
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

  if (controlFlows === false && htmlEntityDecoding === true) {
    outDir = 'dist/withDecoding-withoutControlFlows';
  } else if (controlFlows === false) {
    outDir = 'dist/withoutControlFlows';
  } else if (htmlEntityDecoding === true) {
    outDir = 'dist/withDecoding';
  }

  return {
    bundle: true,
    clean: true,
    // dts: true,
    entry: {
      [node ? 'van-htm' : dev ? 'dev.van-htm' : 'van-htm']: 'src/index.ts'
    },
    outExtension({ format }) {
      return {
        js: format === 'iife' ? `.js` : format === 'esm' ? `.module.js` : `.cjs`
      };
    },
    external: ['alien-signals'],
    format: node ? 'cjs' : ['esm', 'iife'],
    globalName: node ? undefined : 'vanHTM',
    outDir,
    treeshake: true,
    minify: dev ? false : true,
    define: {
      __DEV__: dev ? 'true' : 'false',
      __TEST__: 'false',
      // Code Paths
      __CONTROL_FLOWS__: controlFlows ? 'true' : 'false',
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
  options({ dev: true, controlFlows: true, htmlEntityDecoding: false }), // dev
  options({ dev: true, controlFlows: true, htmlEntityDecoding: true }), // dev-withDecoding
  options({ dev: true, controlFlows: false, htmlEntityDecoding: true }), // dev-withDecoding-withoutControlFlows
  options({ dev: true, controlFlows: false, htmlEntityDecoding: false }), // dev-withoutControlFlows

  // Prod builds
  options({ dev: false, controlFlows: true, htmlEntityDecoding: false }), // prod
  options({ dev: false, controlFlows: true, htmlEntityDecoding: true }), // prod-withDecoding
  options({ dev: false, controlFlows: false, htmlEntityDecoding: true }), // prod-withDecoding-withoutControlFlows
  options({ dev: false, controlFlows: false, htmlEntityDecoding: false }), // prod-withoutControlFlows

  // Node build (single)
  options({ node: true, controlFlows: true, htmlEntityDecoding: false }), // server
  options({ node: true, controlFlows: true, htmlEntityDecoding: true }), // server-withDecoding
  options({ node: true, controlFlows: false, htmlEntityDecoding: true }), // server-withDecoding-withoutControlFlows
  options({ node: true, controlFlows: false, htmlEntityDecoding: false }) // server-withoutControlFlows
]);
