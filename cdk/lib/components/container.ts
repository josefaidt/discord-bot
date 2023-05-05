import * as path from 'node:path'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import type * as ec2 from 'aws-cdk-lib/aws-ec2'

export interface ContainerProps {
  /**
   * Cluster to run the container on
   */
  cluster: ecs.ICluster
  /**
   * Path to the directory containing the Dockerfile
   */
  context: string
  /**
   * Environment variables to pass to the container
   */
  environment?: Record<string, string>
  /**
   * Is the container public?
   * @default false
   */
  isPublic?: boolean
  /**
   * Name of the container
   */
  name: string
  /**
   * Secrets needed for the container to run
   */
  secrets: Record<string, ecs.Secret>
  /**
   * Container image options
   */
  imageOptions?: ecs.AssetImageProps
  /**
   * Specify sidecar containers
   */
  // sidecars?: Container[]
  /**
   * Role to assign to the task definition
   */
  // taskRole?: iam.Role
  /**
   * Permissions to grant to the task role
   */
  permissions?: iam.PolicyStatement[]
  /**
   * Security groups to assign to the service
   */
  securityGroups?: ec2.ISecurityGroup[]
}

/**
 * A container definition
 */
export class Container extends Construct {
  public readonly image: ecs.ContainerImage
  public readonly task: ecs.FargateTaskDefinition
  public readonly container: ecs.ContainerDefinition
  public readonly service: ecs.FargateService

  constructor(scope: Construct, id: string, props: ContainerProps) {
    super(scope, id)

    const {
      name,
      cluster,
      context,
      environment,
      imageOptions,
      isPublic,
      permissions,
      secrets,
      securityGroups,
    } = props

    const image = ecs.ContainerImage.fromAsset(
      path.resolve(process.cwd(), context),
      imageOptions
    )

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      /** @todo proper naming */
      roleName: `${name}-task-role`,
      description: 'Role for the task definition',
    })

    if (permissions?.length) {
      for (const permission of permissions) {
        taskRole.addToPrincipalPolicy(permission)
      }
    }

    const task = new ecs.FargateTaskDefinition(this, 'Task', {
      memoryLimitMiB: 512,
      cpu: 256,
      taskRole,
    })

    const container = new ecs.ContainerDefinition(this, 'Container', {
      containerName: name,
      essential: true,
      image,
      portMappings: [
        {
          containerPort: 3000,
          hostPort: 3000,
        },
      ],
      environment,
      secrets,
      taskDefinition: task,
    })

    const service = new ecs.FargateService(this, 'service', {
      cluster,
      desiredCount: 1,
      taskDefinition: task,
      /** @todo expose security groups prop */
      securityGroups,
      assignPublicIp: !!isPublic,
      // vpcSubnets: {
      //   subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      // }
    })

    // if (sidecars?.length) {
    //   for (const sidecar of sidecars) {
    //     container.addContainerDependencies({
    //       container: sidecar.container,
    //       condition: ecs.ContainerDependencyCondition.START,
    //     })
    //   }
    // }

    this.container = container
    this.image = image
    this.service = service
    this.task = task
  }
}
