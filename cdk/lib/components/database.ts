import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
// import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager'

export interface DatabaseProps {
  /**
   * Name of the database
   */
  name: string
  /**
   * The VPC to deploy the database into
   */
  vpc: ec2.Vpc
}

export class Database extends Construct {
  public readonly instance: rds.DatabaseInstance

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id)

    const { name, vpc } = props

    // const username = 'service'
    // const credentials = new secretsManager.Secret(this, 'DBCredentialsSecret', {
    //   /** @todo create resource name */
    //   secretName: this.createResourceName('database-credentials'),
    //   generateSecretString: {
    //     secretStringTemplate: JSON.stringify({
    //       username,
    //     }),
    //     excludePunctuation: true,
    //     includeSpace: false,
    //     generateStringKey: 'password'
    //   }
    // })

    const database = new rds.DatabaseInstance(this, 'DatabaseInstance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      engine: rds.DatabaseInstanceEngine.mariaDb({
        version: rds.MariaDbEngineVersion.VER_10_6_12,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      multiAz: false,
      allocatedStorage: 100,
      maxAllocatedStorage: 105,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(0),
      deleteAutomatedBackups: true,
      /**
       * @todo set to RETAIN for production
       */
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // removalPolicy: cdk.RemovalPolicy.RETAIN,
      /** @todo enable deletion protection */
      deletionProtection: false,
      databaseName: name,
      publiclyAccessible: false,
    })

    // assign to public props
    this.instance = database

    // set outputs
    new cdk.CfnOutput(this, 'DatabaseHost', {
      value: database.instanceEndpoint.hostname,
    })
  }
}
