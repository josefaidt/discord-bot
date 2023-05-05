import * as rds from 'aws-cdk-lib/aws-rds'

/**
 * Create a database connection string for RDS MySQL
 * @param database RDS MySQL database instance
 * @returns connection string
 */
export function createDatabaseConnectionString(database: rds.DatabaseInstance) {
  const { hostname, port } = database.instanceEndpoint

  return `mysql://${hostname}:${port}`
}
