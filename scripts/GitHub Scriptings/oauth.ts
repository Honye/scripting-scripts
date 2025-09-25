import { Script } from 'scripting'
import { OAuth } from './types'
import { DefaultOAuthApp, StorageKey } from './constants'

export async function authorize() {
  const { clientID, clientSecret } = Storage.get<OAuth>(StorageKey.OAuth) || {
    clientID: DefaultOAuthApp.clientID,
    clientSecret: DefaultOAuthApp.clientSecret
  }
  if (!(clientID && clientSecret)) return

  const oauth = new OAuth2({
    consumerKey: clientID,
    consumerSecret: clientSecret,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    accessTokenUrl: 'https://github.com/login/oauth/access_token',
    responseType: 'code'
  })
  const credential = await oauth.authorize({
    callbackURL: Script.createOAuthCallbackURLScheme(Script.name.replace(/\s/g, '_')),
    scope: 'repo',
    state: 'unkownx'
  })
  Storage.set<OAuth>(StorageKey.OAuth, { clientID, clientSecret, accessToken: credential.oauthToken })
  return credential
}

export async function revoke() {
  const { clientID, clientSecret } = Storage.get<OAuth>(StorageKey.OAuth) || {
    clientID: DefaultOAuthApp.clientID,
    clientSecret: DefaultOAuthApp.clientSecret
  }
  Storage.set<OAuth>(StorageKey.OAuth, { clientID, clientSecret })
  Safari.openURL(`https://github.com/settings/connections/applications/${clientID}`)
}
