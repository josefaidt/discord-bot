import { getSecret } from './get-secret'
import type { ProjectStack } from '../ProjectStack'

/**
 * Retrieves multiple SecureString SSM parameters.
 * @param scope The host stack
 * @param secrets Array of secret names
 */
export function getSecrets<T>(
  scope: ProjectStack,
  secrets: readonly string[]
): T {
  return secrets.reduce<T>(
    (acc, secret) => ({
      ...acc,
      [secret]: getSecret(scope, secret),
    }),
    {} as T
  )
}
