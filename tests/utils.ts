import htm from 'htm/mini';
import { decode } from 'html-entities';
import van from 'vanjs-core';
import * as vanX from 'vanjs-ext';

import vanHTM from '../src/index';

export { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
export { van, vanX };
export const { html, rmPortals } = vanHTM({ htm, van, vanX, decode });
export const promisedTimeout = (timeInMs = 0) => new Promise((resolve) => setTimeout(resolve, timeInMs));
