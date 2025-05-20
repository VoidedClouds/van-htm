import { createVitest } from 'vitest/node';

const vitest = await createVitest('test', {
  include: [],
  globals: true,
  watch: process.argv.includes('--watch')
});

await vitest.start();
