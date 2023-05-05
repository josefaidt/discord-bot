import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'

export interface VpcProps {
  // ...
}

export class Vpc extends Construct {
  public readonly vpc: ec2.Vpc

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id)

    /**
     * VPC used by all resources
     */
    const vpc = new ec2.Vpc(this, `Vpc`, {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      vpcName: `vpc-${this.appName}-${this.envName}`,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    })

    const nacl = new ec2.NetworkAcl(this, 'NetworkAcl', {
      vpc,
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

    this.vpc = vpc
  }
}
