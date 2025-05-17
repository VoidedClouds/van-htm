import { createVitest } from 'vitest/node';

const vitest = await createVitest('test', {
  include: [],
  globals: true,
  watch: process.argv.includes('--watch'),
  test: {
    poolOptions: {
      forks: {
        execArgv: ['--expose-gc']
      }
    }
  }
});

await vitest.start();
