import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import glob from 'fast-glob'
import { api } from './api'
import { Routes } from 'discord-api-types/v10'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'

export class DiscordCommandMap extends Map<string, DiscordCommand> {
  constructor(commands: DiscordCommand[]) {
    super()
    return new Map(commands.map((command) => [command.name, command]))
  }
}

export interface IDiscordCommandBank extends DiscordCommandMap {
  handle(context): Promise<string>
  register(command: RESTPostAPIApplicationCommandsJSONBody): Promise<any>
  unregister(
    commandId: string | number,
    guildId?: string | number
  ): Promise<any>
  list(): Promise<any>
  registerAll(): Promise<any>
}

export class DiscordCommandBank
  extends DiscordCommandMap
  implements IDiscordCommandBank
{
  constructor(commands: DiscordCommand[]) {
    super(commands)
    // needed when extending native types
    Object.setPrototypeOf(this, new.target.prototype)
  }

  public async registerAll() {
    const data = [] as any
    const errors = [] as any
    try {
      console.log('Started refreshing application (/) commands.')

      await api.put(
        Routes.applicationCommands(process.env.DISCORD_APP_ID as string),
        { body: this.values() }
      )

      console.log('Successfully reloaded application (/) commands.')
    } catch (error) {
      console.error(error)
      errors.push(error)
    }
    return { data, errors }
  }

  public async list() {
    const registeredCommands = (await api.get(
      `/applications/${process.env.DISCORD_APP_ID}/commands`
    )) as any[]
    const banked = Array.from(this.values())
    const commands: any[] = banked
    for (const registeredCommand of registeredCommands) {
      const command = commands?.find((c) => c.name === registeredCommand.name)
      if (command) {
        command.registration = registeredCommand
      } else {
        commands.push({
          name: registeredCommand.name,
          description: registeredCommand.description,
          registration: registeredCommand,
        })
      }
    }
    return commands
  }

  public async handle(interaction) {
    const somethingWentWrongResponse = '🤕 Something went wrong'
    const command = this.get(interaction.commandName)
    if (!command)
      throw new Error(`Invalid slash command: ${interaction.commandName}`)

    let response
    try {
      response = await command.handler(interaction)
    } catch (error) {
      console.error(`Error executing command "${command?.name}"`, error)
      response = somethingWentWrongResponse
    }

    return response
  }
}

export function createDiscordCommandBank(
  commands: DiscordCommand[]
): DiscordCommandBank {
  return new DiscordCommandBank(commands)
}
