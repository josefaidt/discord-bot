import Session from 'express-session'
import MemoryStore from 'memorystore'
import Passport from 'passport'
import Strategy from 'passport-oauth2'
import { secrets } from '../secrets.js'

Passport.serializeUser((user, done) => done(null, user))
Passport.deserializeUser((obj, done) => done(null, obj))

Passport.use(
  new Strategy(
    {
      authorizationURL: 'https://discord.com/api/oauth2/authorize',
      tokenURL: 'https://discord.com/api/oauth2/token',
      clientID: secrets.DISCORD_OAUTH_CLIENT_ID,
      clientSecret: secrets.DISCORD_OAUTH_CLIENT_SECRET,
      callbackURL: secrets.DISCORD_OAUTH_REDIRECT_URI,
      scope: ['identify', 'guilds'],
    },
    (accessToken, refreshToken, profile, callback) => {
      process.nextTick(() => callback(null, profile))
    }
  )
)

export const passport = Passport

const Store = MemoryStore(Session)
export const session = Session({
  store: new Store({ checkPeriod: 86400000 }),
  secret: 'supersecret',
  resave: false,
  saveUninitialized: false,
})

export function isAuthenticated(request, response, next) {
  if (request.isAuthenticated()) return next()
  response.redirect('/api/login')
}
