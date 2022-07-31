import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'

// Creates a boop command
export const config = new SlashCommandBuilder()
  .setName('boop')
  .setDescription('Boops the specified user, as many times as you want')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to boop').setRequired(true)
  )
  // Adds an integer option
  .addIntegerOption((option) =>
    option
      .setName('boop_amount')
      .setDescription(
        'How many times should the user be booped (defaults to 1)'
      )
  )
  // Supports choices too!
  .addIntegerOption((option) =>
    option
      .setName('boop_reminder')
      .setDescription('How often should we remind you to boop the user')
      .addChoices({ name: 'Every day', value: 1 }, { name: 'Weekly', value: 7 })
  )

// Get the final raw data that can be sent to Discord
export const handler = async (interaction: ChatInputCommandInteraction) => {
  console.log('GOT INTERACTION', interaction)
  interaction.reply('boop')
}
