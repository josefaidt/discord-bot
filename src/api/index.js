import { Router } from 'express'
import * as interact from './interact.js'
import * as list from './commands/list.js'
import * as sync from './commands/sync.js'
import * as deleteCommand from './commands/delete.js'
import { passport, session, isAuthenticated } from './_auth.js'

async function interactionHandler(request, response) {
  try {
    const interactionResponse = await interact.handler(request)
    if (interactionResponse) {
      return response.json(interactionResponse)
    }
  } catch (error) {
    response.status(500)
    response.json({ error })
  }
}

async function notImplemented(request, response) {
  response.status(501)
  response.end()
}

export const api = new Router()

api.all('/interact', interactionHandler)
// TODO: move `sync` to command handler only executable by mods/frontend
// TODO: authorize `/api/commands` calls for use in prod
if (process.env.NODE_ENV !== 'production') {
  if (process.env.DISCORD_ENABLE_AUTH) {
    api.use(session)
    api.use(passport.initialize())
    api.use(passport.session())

    api.get('/login', passport.authenticate('oauth2'))
    api.get(
      '/login/callback',
      passport.authenticate('oauth2', { failureRedirect: '/' }),
      function (request, response) {
        console.log('Login callback, success!', request)
        response.redirect('/')
      }
    )
    api.get('/logout', notImplemented)

    api.use(isAuthenticated)
    api.get('/hello', (request, response) => response.json({ hello: 'world' }))
  }

  api.get('/commands/list', list.handler)
  api.post('/commands/sync', sync.handler)
  api.delete('/commands/delete/:id', deleteCommand.handler)
}
