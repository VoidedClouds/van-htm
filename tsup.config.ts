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

function options({ controlFlows = true, dev, htmlEntityDecoding = true, node }: BundleOptions): Options {
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

  if (!node) {
    if (controlFlows === false && htmlEntityDecoding === false) {
      outDir = 'dist/noCF-noDec';
    } else if (controlFlows === false) {
      outDir = 'dist/noCF';
    } else if (htmlEntityDecoding === false) {
      outDir = 'dist/noDec';
    }
  }

  return {
    bundle: true,
    clean: true,
    // dts: true,
    entry: {
      [node ? 'node' : dev ? 'dev.van-htm' : 'van-htm']: 'src/index.ts'
    },
    external: ['alien-signals'],
    format: node ? 'cjs' : ['esm', 'iife'],
    globalName: node ? undefined : 'vanHtm',
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
  options({ dev: true, controlFlows: true, htmlEntityDecoding: true }), // dev
  options({ dev: true, controlFlows: false, htmlEntityDecoding: true }), // dev-noCF
  options({ dev: true, controlFlows: true, htmlEntityDecoding: false }), // dev-noDec
  options({ dev: true, controlFlows: false, htmlEntityDecoding: false }), // dev-noCF-noDec

  // Prod builds
  options({ dev: false, controlFlows: true, htmlEntityDecoding: true }), // prod
  options({ dev: false, controlFlows: false, htmlEntityDecoding: true }), // prod-noCF
  options({ dev: false, controlFlows: true, htmlEntityDecoding: false }), // prod-noDec
  options({ dev: false, controlFlows: false, htmlEntityDecoding: false }), // prod-noCF-noDec

  // Node build (single)
  options({ node: true, controlFlows: false, htmlEntityDecoding: true }) // server
]);
