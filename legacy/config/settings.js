module.exports = { //Default settings.
  defaultPort: 8080,
  appName: 'secrettoymaker',
  anetURL: 'https://api.guildwars2.com/v2',
  account: '/account?access_token={apitoken}',
  tokeninfo: '/tokeninfo?access_token={apitoken}',
  gmcAPIKey: '[REDACTED]',
  gmcSenderID: '[REDACTED]',
  webAPIKey: '[REDACTED]',
  vapidKeys: {
    publicKey: '[REDACTED]',
    privateKey: '[REDACTED]'
  }
};
