import { Construct } from 'constructs'
import { Project } from './Project'

export class ProjectConstruct extends Construct {
  public readonly project: Project

  constructor(scope: Construct, id: string) {
    super(scope, id)

    const name = this.node.tryGetContext('name')
    const env = this.node.tryGetContext('env')
    const version = this.node.tryGetContext('version')

    this.project = new Project({
      name,
      env,
      version,
    })
  }

  /**
   * Create a project resource name
   * @param name Resource name in kebab-case
   * @returns Project resource name
   */
  public createResourceName(name: string): string {
    return `${this.project.name}-${this.project.env}-${name}`
  }
}
