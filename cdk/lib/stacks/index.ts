import * as path from 'node:path'
import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfrontorigins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elasticloadbalancing from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { AmplifyAwsSubdomain } from '../components/amplify-aws-subdomain'
import { WAF } from '../components/waf'
import { Container } from '../components/container'
import { Database } from '../components/database'
import { REQUIRED_SECRETS } from '../constants'
import { ProjectStack } from '../ProjectStack'
import { getSecrets } from '../support/get-secrets'
import type { AmplifyAwsSubdomainProps } from '../components/amplify-aws-subdomain'

type HeyAmplifyStackProps = Partial<cdk.StackProps> & {
  subdomain: AmplifyAwsSubdomainProps
}

type RequiredSecrets = Record<(typeof REQUIRED_SECRETS)[number], ssm.IParameter>

export class HeyAmplifyStack extends ProjectStack {
  // private readonly project: Project = this.node.tryGetContext('project')

  constructor(scope: Construct, id: string, props: HeyAmplifyStackProps) {
    super(scope, id, props)

    // NOTE: this TypeScript trick is to say `secrets` should include key value pairs where the keys are one of the names in the array above
    const secrets = getSecrets<RequiredSecrets>(this, REQUIRED_SECRETS)

    // set tags to resources
    cdk.Tags.of(this).add('app:name', this.project.name)
    cdk.Tags.of(this).add('app:env', this.project.env)

    /**
     * VPC used by all resources
     */
    const vpc = new ec2.Vpc(this, `Vpc`, {
      // cidr: '10.0.0.0/16',
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      vpcName: this.createResourceName('vpc'),
      subnetConfiguration: [
        {
          name: this.createResourceName('public-subnet-1'),
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: this.createResourceName('private-subnet-1'),
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 28,
        },
        {
          name: this.createResourceName('isolated-subnet-1'),
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    })

    const nacl = new ec2.NetworkAcl(this, 'NetworkAcl', {
      vpc,
      networkAclName: this.createResourceName('nacl'),
    })

    nacl.addEntry('Ingress', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 99,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
    })
    nacl.addEntry('IngressHTTPS', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 98,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
    })
    nacl.addEntry('IngressSSH', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
    })
    nacl.addEntry('EgressHTTP', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 1,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.EGRESS,
    })
    nacl.addEntry('EgressHTTPS', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 2,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.EGRESS,
    })
    nacl.addEntry('IngressLoadBalancer', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 97,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
    })
    nacl.addEntry('EgressLoadBalancer', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 3,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.EGRESS,
    })

    for (const subnet of vpc.publicSubnets) {
      subnet.associateNetworkAcl('PublicSubnetNetworkAcl', nacl)
    }

    const subdomain = new AmplifyAwsSubdomain(
      this,
      'Subdomain',
      props.subdomain
    )

    // create bucket for backups (logs, etc.)
    const bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: this.createResourceName('bucket'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      // if env is destroyed, keep the bucket
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // autoDeleteObjects: true,
      serverAccessLogsPrefix: 's3-access',
    })

    const database = new Database(this, 'Database', {
      name: this.createResourceName('database'),
      vpc,
    })

    const loadBalancer = new elasticloadbalancing.ApplicationLoadBalancer(
      this,
      'LoadBalancer',
      {
        vpc,
        vpcSubnets: {
          subnets: vpc.publicSubnets,
          /** @todo is this necessary? */
          // subnetType: ec2.SubnetType.PUBLIC,
        },
        internetFacing: true,
      }
    )

    const targetGroupHttp = new elasticloadbalancing.ApplicationTargetGroup(
      this,
      'TargetGroupHttp',
      {
        vpc,
        port: 80,
        protocol: elasticloadbalancing.ApplicationProtocol.HTTP,
        targetType: elasticloadbalancing.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 2,
        },
      }
    )

    const listener = loadBalancer.addListener('Listener', {
      port: 443,
      open: true,
      certificates: [subdomain.certificate],
    })

    listener.addTargetGroups('LoadBalancerTargetGroupHttp', {
      targetGroups: [targetGroupHttp],
    })

    // use a security group to provide a secure connection between the ALB and the containers
    const loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      'LoadBalancerSecurityGroup',
      {
        vpc,
        allowAllOutbound: true,
      }
    )

    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow https traffic'
    )

    loadBalancer.addSecurityGroup(loadBalancerSecurityGroup)

    const cluster = new ecs.Cluster(this, `Cluster`, {
      vpc,
      clusterName: this.createResourceName('cluster'),
    })

    database.instance.connections.allowDefaultPortFrom(
      cluster,
      'Allow database access from cluster services'
    )

    const botContainer = new Container(this, 'BotContainer', {
      cluster,
      /** @todo better project root pathing */
      context: path.join(process.cwd(), '..', 'apps/discord-bot'),
      environment: {
        DATABASE_URL: database.instance.dbInstanceEndpointAddress,
      },
      isPublic: false,
      name: this.createResourceName('bot'),
      secrets: Object.entries(secrets).reduce((acc, [key, parameter]) => {
        return {
          ...acc,
          [key]: ecs.Secret.fromSsmParameter(parameter),
        }
      }, {}),
    })

    loadBalancerSecurityGroup.connections.allowFrom(
      loadBalancer,
      ec2.Port.allTcp(),
      'Application load balancer'
    )

    const frontendContainer = new Container(this, 'FrontendContainer', {
      cluster,
      /** @todo better project root pathing */
      context: path.join(process.cwd(), '..', 'apps/bot.amplify.aws'),
      environment: {
        DATABASE_URL: database.instance.dbInstanceEndpointAddress,
      },
      isPublic: true,
      name: this.createResourceName('frontend'),
      secrets: Object.entries(secrets).reduce((acc, [key, parameter]) => {
        return {
          ...acc,
          [key]: ecs.Secret.fromSsmParameter(parameter),
        }
      }, {}),
      securityGroups: [loadBalancerSecurityGroup],
    })

    // add to a target group so make containers discoverable by the application load balancer
    frontendContainer.service.attachToApplicationTargetGroup(targetGroupHttp)

    // BONUS: Autoscaling based on memory and CPU usage
    const scalableTaget = frontendContainer.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 5,
    })

    scalableTaget.scaleOnMemoryUtilization('ScaleUpMemory', {
      targetUtilizationPercent: 75,
    })

    scalableTaget.scaleOnCpuUtilization('ScaleUpCPU', {
      targetUtilizationPercent: 75,
    })

    // The ECS Service used for deploying tasks
    // const service = new ecs.FargateService(this, 'service', {
    //   cluster,
    //   desiredCount: 1,
    //   taskDefinition,
    //   securityGroups: [ecsSG],
    //   assignPublicIp: true,
    // })

    // add to a target group so make containers discoverable by the application load balancer
    // service.attachToApplicationTargetGroup(targetGroupHttp)

    // BONUS: Autoscaling based on memory and CPU usage
    // const scalableTaget = service.autoScaleTaskCount({
    //   minCapacity: 2,
    //   maxCapacity: 5,
    // })

    // scalableTaget.scaleOnMemoryUtilization('ScaleUpMem', {
    //   targetUtilizationPercent: 75,
    // })

    // scalableTaget.scaleOnCpuUtilization('ScaleUpCPU', {
    //   targetUtilizationPercent: 75,
    // })

    const headerAllowlist = [
      'X-GitHub-Delivery',
      'X-GitHub-Event',
      'X-GitHub-Hook-ID',
      'X-GitHub-Hook-Installation-Target-ID',
      'X-GitHub-Hook-Installation-Target-Type',
      'X-Hub-Signature',
      'X-Hub-Signature-256',
    ]

    // set up CloudFront
    const distribution = new cloudfront.Distribution(this, 'CFDistribution', {
      // domainNames and certificate needed for amplify.aws subdomain (connected to a Route53 hosted zone)
      domainNames: subdomain?.domainNames ? subdomain.domainNames : undefined,
      certificate: subdomain?.certificate ? subdomain.certificate : undefined,
      defaultBehavior: {
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new cloudfront.CachePolicy(this, 'CachePolicy', {
          headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
            ...headerAllowlist
          ),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
          cookieBehavior: cloudfront.CacheCookieBehavior.all(),
        }),
        origin: new cloudfrontorigins.LoadBalancerV2Origin(loadBalancer, {
          customHeaders: {
            // send the X-HeyAmplify-Security-Token header to the ALB
            // [xAmzSecurityTokenHeaderName]: xAmzSecurityTokenHeaderValue,
          },
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      },
      // add Web Application Firewall (WAF)
      webAclId: new WAF(this, 'WAFCloudFront', {
        name: 'WAFCloudFront',
      }).attrArn, // should this be 'ref'? https://www.gravitywell.co.uk/insights/deploying-applications-to-ecs-fargate-with-aws-cdk/
    })

    // const filesystemMountPoint = '/data'
    // new HeyAmplifyApp(this, `Bot`, {
    //   bucket,
    //   cluster,
    //   docker: {
    //     name: `${this.appName}-bot`,
    //     context: path.join(PROJECT_ROOT, 'apps/discord-bot'),
    //     dockerfile: 'Dockerfile',
    //     environment: {
    //       DATABASE_URL: `file:${filesystemMountPoint}/${this.envName}.db?connection_limit=1`,
    //       ...getSvelteKitEnvironmentVariables(this.envName),
    //     },
    //   },
    //   secrets,
    //   subdomain,
    //   filesystem,
    //   filesystemMountPoint,
    // })

    // new SupportBox(this, 'SupportBox', {
    //   bucket,
    //   filesystem,
    //   subdomain,
    //   vpc,
    // })
  }
}
