import { commands } from '@hey-amplify/bot'
import type { RequestHandler } from '@sveltejs/kit'

/** @type {RequestHandler} */
export async function del({ request }) {
  const { id } = await request.json()
  const unregistered = await commands.unregister(id)

  if (!unregistered) {
    return {
      status: 500,
    }
  }

  return {
    body: { unregistered },
  }
}
