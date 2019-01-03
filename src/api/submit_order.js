const {post} = require('request-promise')
const parse = require('../lib/parse/response/submit_order')

module.exports = async (efx, symbol, amount, price, gid, cid, signedOrder, validFor) => {
  if (!(symbol && amount && price)) {
    throw new Error('order, symbol, amount and price are required')
  }

  //TODO: check if symbol is a valid symbol

  if(!signedOrder){
    const order = await efx.contract.createOrder(symbol, amount, price, validFor)

    signedOrder = await efx.sign.order(order)
  }

  const meta = signedOrder

  const type = 'EXCHANGE LIMIT'

  const protocol = '0x'

  symbol = 't' + symbol

  const data = {
    gid,
    cid,
    type,
    symbol,
    amount,
    price,
    meta,
    protocol
  }

  const url = efx.config.api + '/w/on'

  return parse(post(url, {json: data}))
}
