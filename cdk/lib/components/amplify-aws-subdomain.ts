import { Construct } from 'constructs'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'

export interface AmplifyAwsSubdomainProps {
  hostedZoneName: string
  hostedZoneId: string
}

export class AmplifyAwsSubdomain extends Construct {
  public readonly hostedZone: route53.HostedZone
  public readonly certificate: acm.Certificate
  public readonly domainName: string
  public readonly domainNames: string[]

  constructor(scope: Construct, id: string, props: AmplifyAwsSubdomainProps) {
    super(scope, id)

    const { hostedZoneName, hostedZoneId } = props

    // import manually created hosted zone (we do not need to manage this environment-agnostic resource)
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'ImportedHostedZone',
      {
        zoneName: hostedZoneName,
        hostedZoneId,
      }
    )

    // create a domain name scoped to the app env
    const domainName = hostedZoneName
    const domainNames = [domainName]

    // create an env-specific certificate to later be applied to the CloudFront distribution
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    })

    // set public props
    this.hostedZone = hostedZone as route53.HostedZone
    this.certificate = certificate
    this.domainName = domainName
    this.domainNames = domainNames
  }
}
