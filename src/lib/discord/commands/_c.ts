import { SlashCommandBuilder } from 'discord.js'
import type { InteractionReplyOptions, CommandInteraction } from 'discord.js'

export type DiscordCommandHandler = (
  interaction: CommandInteraction | unknown
) =>
  | string
  | undefined
  | InteractionReplyOptions
  | Promise<string | undefined | InteractionReplyOptions>

type DiscordCommandProps = {
  name: string
  description: string
  enabledByDefault?: boolean
  handler: DiscordCommandHandler
}

interface IDiscordCommand extends SlashCommandBuilder {
  handler: DiscordCommandHandler
}

export class DiscordCommand
  extends SlashCommandBuilder
  implements IDiscordCommand
{
  public readonly handler: DiscordCommandHandler

  constructor(props: DiscordCommandProps) {
    super()
    this.setName(props.name)
    this.setDescription(props.description)
    if (props.enabledByDefault === false) {
      this.setDefaultMemberPermissions('0')
    }
    this.handler = props.handler
  }
}

export function createCommand(props: DiscordCommandProps) {
  return new DiscordCommand(props)
}
