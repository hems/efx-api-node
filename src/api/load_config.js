const defaultConfig = require('../config')

module.exports = async (efx, userConfig) => {
  // saves last used userConfig
  efx.userConfig = efx.userConfig || userConfig

  // merge user config with default config
  // needed for the efx.getConfig method
  efx.config = Object.assign({}, defaultConfig, userConfig)

  // ethfinex exchange config
  const exchangeConf = await efx.getConfig()

  // mergees exchangeConf with default and userConfig
  efx.config = Object.assign({}, defaultConfig, exchangeConf, userConfig)

  return efx.config
}
