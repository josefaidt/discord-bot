import { fileURLToPath } from 'node:url'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, loadEnv } from 'vite'
import type { UserConfig } from 'vitest/config'

function relative(path) {
  return fileURLToPath(new URL(path, import.meta.url))
}

/**
 * Load's environment variables for development
 * by default Vite's `loadEnv` will only load variables prefixed with "VITE_"
 */
export function loadEnvVars(mode = 'development') {
  Object.assign(
    process.env,
    loadEnv(mode, relative('../../'), [
      'DISCORD_',
      'GITHUB_',
      'DATABASE_',
      'NEXTAUTH_',
    ])
  )
}

export default defineConfig(({ mode }) => {
  // `vitest` sets mode to test, load local environment variables for test
  if (mode === 'test') {
    loadEnvVars(mode)
  } else {
    // rely on Vite to load public env vars (i.e. prefixed with VITE_)
    loadEnvVars()
  }
  const config: UserConfig = {
    envDir: '../../',
    define: {
      'import.meta.vitest': 'undefined',
    },
    optimizeDeps: {
      include: [
        // '@carbon/charts',
        // '@hey-amplify/prisma-client',
        // '@hey-amplify/discord',
      ],
    },
    plugins: [sveltekit()],
    ssr: {
      external: [
        '@hey-amplify/prisma-client',
        '@hey-amplify/discord',
        'discord.js',
      ],
      noExternal: [
        '@carbon/charts',
        'carbon-components',
        // '@hey-amplify/discord',
        // '@hey-amplify/prisma-client',
      ],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['tests/**/*.ts'],
      exclude: ['tests/setup/**/*.ts', 'tests/mock/**/*.ts'],
      includeSource: ['src/**/*.{js,ts,svelte}'],
      setupFiles: [
        'tests/setup/svelte-kit-routes.ts',
        'tests/setup/seed.ts',
        'tests/setup/github-secrets-enabled.ts',
      ],
      env: {
        SSR: 'true',
      },
    },
  }
  return config
})
