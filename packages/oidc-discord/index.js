import express from 'express'
import bodyParser from 'body-parser'
import fetch from 'node-fetch'

const DISCORD_API_URL = 'https://discord.com/api'
const DISCORD_OAUTH_AUTHORIZE_URL = 'https://discord.com/api/oauth2/authorize'
const DISCORD_OAUTH_TOKEN_URL = 'https://discord.com/api/oauth2/token'
const DISCORD_OAUTH_TOKEN_REVOKE_URL =
  'https://discord.com/api/oauth2/token/revoke'

/**
 * Creates URL Search Params string from an object
 * @param {Object.<string, number|string>} params
 * @returns {string}
 */
function createURLSearchParamString(params) {
  const searchParams = new URLSearchParams()
  for (let [key, value] of Object.entries(params)) {
    searchParams.append(key, value)
  }
  return searchParams.toString()
}

async function authorize(req, res) {
  const params = {
    response_type: 'code',
    client_id: process.env.DISCORD_OAUTH_CLIENT_ID,
    scope: 'identify guilds.join', // openid
    state: 'replaceme',
    prompt: 'none',
  }
  const redirect_uri = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/login/callback`
  params.redirect_uri = redirect_uri
  const url = `${DISCORD_OAUTH_AUTHORIZE_URL}?${createURLSearchParamString(
    params
  )}`
  res.redirect(url)
}

/**
 * Express.js app
 * @param {import('express').RequestHandler[]} middlewares - middleware to add on init
 * @returns {import('express').Application}
 */
export function app(middlewares = []) {
  const server = express()
  server.use(bodyParser.json())

  if (middlewares.length) {
    for (let middleware of middlewares) {
      server.use(middleware)
    }
  }

  // Enable CORS for all methods
  server.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    next()
  })

  server.get('/hello', function (req, res) {
    res.json(JSON.stringify('Hello World!')).end()
  })

  server.get('/login', authorize)
  server.get('/login/callback', async function (req, res) {
    const code = req.query.code
    const redirect_uri = `${req.protocol}://${req.get('host')}`
    const params = {
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id: process.env.DISCORD_OAUTH_CLIENT_ID,
      client_secret: process.env.DISCORD_OAUTH_CLIENT_SECRET,
    }
    const response = await fetch(DISCORD_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: createURLSearchParamString(params),
    })
    const json = await response.json()
    res.json(json).end()
  })

  return server
}
