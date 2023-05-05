import type { Project } from './Project'

/**
 * Create a resource name
 * @param project Project instance
 * @param name Resource name
 */
export function createResourceName(project: Project, name: string) {
  return `${project.name}-${project.env}-${name}`
}
