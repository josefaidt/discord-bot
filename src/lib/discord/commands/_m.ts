import { EmbedBuilder } from 'discord.js'

export const m = {
  say: (message: string, ephemeral = false) => {
    const embed = new EmbedBuilder()
    embed.setColor('#ff9900')
    embed.setDescription(message)
    return { embeds: [embed], ephemeral }
  },
}
