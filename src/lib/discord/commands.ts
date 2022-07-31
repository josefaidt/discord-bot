import type {
  SlashCommandBuilder,
  ContextMenuCommandBuilder,
} from '@discordjs/builders'
import type {
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  MessageContextMenuCommandInteraction,
} from 'discord.js'

/**
 * Imported slash command has two exports:
 * 1. config - instance of the command builder
 * 1. handler - function to handler the command
 */
type ImportedSlashCommand = {
  config: SlashCommandBuilder
  handler: (
    interaction: ChatInputCommandInteraction
  ) => Promise<string | undefined | InteractionReplyOptions>
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
  ) =>
    | string
    | undefined
    | InteractionReplyOptions
    | Promise<string | undefined | InteractionReplyOptions>
}

type Builder = ImportedSlashCommand | ImportedContextMenuCommand
type ImportedCommands = Builder[]

class ExtendedBuilder<T extends Builder> {
  constructor(props: T) {}

  public readonly handler: (
    interaction: ChatInputCommandInteraction
  ) => Promise<string | undefined | InteractionReplyOptions>
}

export const createCommandsBank = (commands: ImportedCommands) => {
  const map = new Map()
  for (const command of commands) {
    const value = command.config
    value.handler = command.handler
    map.set(command.config.name, value)
  }
  return map
}
