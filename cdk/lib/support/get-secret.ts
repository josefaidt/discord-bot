import * as ssm from 'aws-cdk-lib/aws-ssm'
import type { ProjectStack } from '../ProjectStack'

/**
 * Retrieves the SecureString SSM parameter for `name`.
 * @param scope The host stack.
 * @param name The environment variable's name.
 * @returns The SSM parameter construct.
 */
export function getSecret(scope: ProjectStack, name: string): ssm.IParameter {
  return ssm.StringParameter.fromSecureStringParameterAttributes(
    scope,
    `ssm-${name}`,
    {
      parameterName: `/app/${scope.project.name}/${scope.project.env}/secret/${name}`,
    }
  )
}
