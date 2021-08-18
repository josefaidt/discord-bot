import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * @typedef {Object} Secrets
 * @property {string} DISCORD_APP_ID
 * @property {string} DISCORD_TOKEN
 * @property {string} DISCORD_PUBLIC_KEY
 * @property {string} DISCORD_OAUTH_CLIENT_ID
 * @property {string} DISCORD_OAUTH_CLIENT_SECRET
 * @property {string} DISCORD_OAUTH_REDIRECT_URI
 */

/**
 * @type {Secrets}
 */
export let secrets

function readFromLocal() {
  return {
    DISCORD_APP_ID: process.env.DISCORD_APP_ID,
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
    DISCORD_OAUTH_CLIENT_ID: process.env.DISCORD_OAUTH_CLIENT_ID,
    DISCORD_OAUTH_CLIENT_SECRET: process.env.DISCORD_OAUTH_CLIENT_SECRET,
    DISCORD_OAUTH_REDIRECT_URI: process.env.DISCORD_OAUTH_REDIRECT_URI,
  }
}

async function readFromSSM() {
  const client = new SSMClient({ region: process.env.AWS_REGION })

  const Names = [
    process.env.DISCORD_APP_ID,
    process.env.DISCORD_TOKEN,
    process.env.DISCORD_PUBLIC_KEY,
  ]

  const command = new GetParametersCommand({ Names, WithDecryption: true })
  const params = await client.send(command)

  return params.Parameters?.reduce((acc, { Name, Value }) => {
    if (Name) acc[Name.split('/').pop()] = Value
    return acc
  }, {})
}

async function init() {
  if (secrets) {
    console.info('Secrets already loaded')
    return secrets
  }

  if (isProduction) {
    // read from ParameterStore
    secrets = await readFromSSM()
  } else {
    secrets = readFromLocal()
  }

  if (secrets) {
    console.info('Successfully fetched secrets')
  }
}

export default init()
