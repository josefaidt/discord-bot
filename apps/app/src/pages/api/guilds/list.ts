import type { RequestHandler } from '@sveltejs/kit'
import { Routes } from 'discord-api-types/v10'
import { api } from '../_discord'

/** @type {RequestHandler} */
export async function get({ request }) {
  // TOOD: only show guilds the authenticated user is in
  const guilds = await api.get(Routes.userGuilds())

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(guilds),
  }
}
