import * as Discord from 'discord.js'
import type { IntentsString, ClientOptions } from 'discord.js'
import type { RawGuildData } from 'discord.js/typings/rawDataTypes'
import type { APIGuild } from 'discord-api-types/v10'
import { createBot, prisma } from '@hey-amplify/bot'

// aws-amplify Discord server template
const GUILD_TEMPLATE = 'https://discord.new/vmyFvRYDtUsn'
const intents: IntentsString[] = ['GUILD_MESSAGES', 'GUILD_MESSAGES']

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error('Bot token not available')
}

type MockGuildProps = RawGuildData & {
  client: Discord.Client
}

// TODO: mock guild? we need a way to simulate messaging without sending requests to the API
// class MockGuild extends Discord.Guild {
//   constructor({ client, ...rest }: MockGuildProps) {
//     super(client, rest)
//   }
// }

class MockClient extends Discord.Client {
  constructor(options: ClientOptions) {
    super(options)
  }
}

export default async function () {
  const bot = await createBot()
  const client = new Discord.Client({ intents })
  // const guild = new Discord.Guild(client, {
  //   id: Discord.SnowflakeUtil.generate(),
  // })

  return async () => {
    prisma.$disconnect()
  }
}
