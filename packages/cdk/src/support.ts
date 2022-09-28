import { loadEnv } from 'vite'
import { PROJECT_ROOT } from './constants'

/**
 * Gets environment variables required for Svelte-Kit build
 * by default Vite's `loadEnv` will only load variables prefixed with "VITE_"
 */
export function getSvelteKitEnvironmentVariables(env: string) {
  return loadEnv(env, PROJECT_ROOT, ['VITE_', 'PUBLIC_'])
}
