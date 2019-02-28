const blockchain = require('../blockchain/fixture')
const nock = require('nock')

module.exports = async () => {
  fixture = await blockchain()

  /**
  console.log( "fixtured exchange ->", fixture.exchange.address )
  console.log( "fixtured WETH     ->", fixture.WETH.address )
  console.log( "fixtured USD      ->", fixture.USD.address )
  console.log( "fixtured WUSD     ->", fixture.WUSD.address )
  console.log( "fixtured ZRX      ->", fixture.ZRX.address )
  console.log( "fixtured WZRX     ->", fixture.WZRX.address )
  **/

  const apiResponse = {
   "0x":{
      "protocol": "0x",
      "minOrderTime": 300,
      "tokenRegistry":{
         "ETH":{
            "decimals": 18,
            "wrapperAddress": fixture.WETH.address,
            "minOrderSize": 0.1
         },
         "USD":{
            "decimals":6,
            "wrapperAddress": fixture.WUSD.address,
            "tokenAddress": fixture.USD.address,
            "minOrderSize": 25,
            "settleSpread": -0.026
         },
         "ZRX":{
            "decimals":18,
            "wrapperAddress": fixture.WZRX.address,
            "tokenAddress": fixture.ZRX.address,
            "minOrderSize": 40
         },
      },
     "ethfinexAddress": "0x61b9898c9b60a159fc91ae8026563cd226b7a0c1", // gets fee paid in
     "exchangeAddress": fixture.exchange.address, // actual exchange contract address
      "exchangeSymbols":[
         "tETHUSD",
         "tZRXUSD",
         "tZRXETH"
      ]
   }
  }

  nock('https://test.ethfinex.com:443', {"encodedQueryParams":true})
    .post('/trustless/v1/r/get/conf', {})
    .reply(200, apiResponse)
}
