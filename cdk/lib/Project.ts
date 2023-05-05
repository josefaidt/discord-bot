export interface IProject {
  /**
   * Project name
   */
  readonly name: string
  /**
   * Project environment
   */
  readonly env: string
  /**
   * Project version
   */
  readonly version?: string
}

type ProjectProps = Writable<Flatten<IProject>>

/**
 * Project
 */
export class Project implements IProject {
  public readonly name: string
  public readonly env: string
  public readonly version?: string

  constructor(props: ProjectProps) {
    this.name = props.name
    this.env = props.env
    this.version = props.version
  }
}

export function createProject(props: ProjectProps): Project {
  return new Project(props)
}
