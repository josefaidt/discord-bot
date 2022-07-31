import type {
  SlashCommandBuilder,
  ContextMenuCommandBuilder,
} from '@discordjs/builders'
import type {
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  MessageContextMenuCommandInteraction,
} from 'discord.js'

type CommandHandlerReturnType =
  | string
  | undefined
  | InteractionReplyOptions
  | Promise<string | undefined | InteractionReplyOptions>

/**
 * Imported slash command has two exports:
 * 1. config - instance of the command builder
 * 1. handler - function to handler the command
 */
type ImportedSlashCommand = {
  config: SlashCommandBuilder
  handler: (
    interaction: ChatInputCommandInteraction
  ) => CommandHandlerReturnType
}

/**
 * Imported context menu command has two exports:
 * 1. config - instance of the command builder
 * 1. handler - function to handler the command
 */
type ImportedContextMenuCommand = {
  config: ContextMenuCommandBuilder
  handler: (
    interaction: MessageContextMenuCommandInteraction
  ) => CommandHandlerReturnType
}

type ImportedCommand = ImportedSlashCommand | ImportedContextMenuCommand
// TODO: how to extend to map each interaction type to the builder type?
export type Command = {
  name: string
  description: string | undefined
  config: SlashCommandBuilder | ContextMenuCommandBuilder
  _handler: (
    interaction:
      | MessageContextMenuCommandInteraction
      | ChatInputCommandInteraction
  ) => CommandHandlerReturnType
  handle: (
    interaction:
      | MessageContextMenuCommandInteraction
      | ChatInputCommandInteraction
  ) => CommandHandlerReturnType
}

export function createCommandsMap(
  commands: ImportedCommand[]
): Map<string, Command> {
  const map = new Map()
  for (const command of commands) {
    // wrap the handler to catch any errors
    const handle: typeof command.handler = async (interaction) => {
      const somethingWentWrongResponse = '🤕 Something went wrong'
      let response
      try {
        response = await command.handler(interaction)
      } catch (error) {
        console.error(`Error executing command "${command.config.name}"`, error)
        response = somethingWentWrongResponse
      }
      return response
    }
    map.set(command.config.name, {
      name: command.config.name,
      description: command.config?.description,
      config: command.config,
      handler: command.handler,
      handle,
    })
  }
  return map
}
