import type {
  SlashCommandBuilder,
  ContextMenuCommandBuilder,
} from '@discordjs/builders'
import type {
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  MessageContextMenuCommandInteraction,
} from 'discord.js'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'

export interface IDiscordCommandBank extends Map<string, Builder> {
  handle(context): Promise<string>
  register(command: RESTPostAPIApplicationCommandsJSONBody): Promise<any>
  unregister(
    commandId: string | number,
    guildId?: string | number
  ): Promise<any>
  list(): Promise<any>
  registerAll(): Promise<any>
}

type Builder = ImportedSlashCommand | ImportedContextMenuCommand
type ImportedCommands = Builder[]
