/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'

// load env vars for bot development
Object.assign(
  process.env,
  loadEnv('e2e', new URL('../../', import.meta.url).pathname, ['DISCORD_'])
)

export default defineConfig({
  envPrefix: 'DISCORD_',
  envDir: '../',
  build: {
    // we're not actually building anything, but we need to set `target` to use `import.meta`
    target: 'esnext',
  },
  test: {
    includeSource: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '../packages/**/src/**/*.{ts,js}',
    ],
    globals: true,
    globalSetup: ['tests/setup.ts'],
  },
})
