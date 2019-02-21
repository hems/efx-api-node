/* eslint-env mocha */

const { assert } = require('chai')
const nock = require('nock')
const mockGetConf = require('./fixtures/nock/get_conf')

const instance = require('./instance')
const {ZeroEx} = require('0x.js')
const utils = require('ethereumjs-util')

// TODO: use arrayToOrder to convert response from HTTP API
//const orderToArray = require('lib-js-util-schema')

let efx

before(async () => {
  mockGetConf()
  efx = await instance()
})

const ecRecover = require('./helpers/ecRecover')

it('efx.cancelOrder(orderId) // handle INVALID ERROR order', async () => {
  const orderId = 1
  const apiResponse = [
    'error',
    10020,
    'ERR_EFXAPI_ORDER_INVALID'
  ]

  nock('https://test.ethfinex.com')
    .post('/trustless/v1/w/oc', async (body) => {
      assert.equal(body.orderId, orderId)
      assert.equal(body.protocol, '0x')

      assert.ok(body.signature)

      let toSign = utils.sha3(orderId.toString(16))
      toSign = utils.bufferToHex(toSign).slice(2)

      const recovered = ecRecover(toSign, body.signature)

      // TODO: fix ecRecover algo for orderId signature
      //assert.equal(efx.get('account').toLowerCase(), recovered.toLowerCase())
      return true
    })
    .reply(500, apiResponse)

  result = await efx.cancelOrder(orderId)

  assert.equal(result.error.code, 10020)
  assert.equal(result.error.message, 'ERR_EFXAPI_ORDER_INVALID')
  assert.ok(result.error.reason)

})

it('efx.cancelOrder(orderId, signedOrder) // cancels a previously signed order', async () => {
  const orderId = 1
  const signedOrder = await efx.sign.cancelOrder(orderId)
  const apiResponse = [1234]

  nock('https://test.ethfinex.com')
    .post('/trustless/v1/w/oc', async (body) => {
      assert.equal(body.orderId, orderId)
      assert.equal(body.protocol, '0x')

      assert.ok(body.signature)

      let toSign = utils.sha3(orderId.toString(16))
      toSign = utils.bufferToHex(toSign).slice(2)

      const recovered = ecRecover(toSign, body.signature)

      // TODO: fix ecRecover algo for orderId signature
      //assert.equal(efx.get('account').toLowerCase(), recovered.toLowerCase())

      return true
    })
    .reply(200, apiResponse)

  const response = await efx.cancelOrder(orderId, signedOrder)
  assert.deepEqual(response, apiResponse)
})

it('efx.getOrder(orderId)', async () => {
  efx.account.unlock('password')
  const orderId = 1

  const apiResponse = [[1234]]

  nock('https://test.ethfinex.com')
    .post('/trustless/v1/r/orders', (body) => {
      assert.equal(body.id, orderId)
      assert.equal(body.protocol, '0x')
      assert.ok(body.nonce)
      assert.ok(body.signature)

      // sign the nonce from scratched
      let toSign = body.nonce.toString(16)

      const recovered = ecRecover(toSign, body.signature)

      assert.equal(efx.get('account').toLowerCase(), recovered.toLowerCase())

      return true
    })
    .reply(200, apiResponse)

  const response = await efx.getOrder(orderId)

  // TODO:
  // - record real response using nock.recorder.rec()
  // - validate the actual response
  assert.deepEqual(response, apiResponse)
})

it('efx.getOrders()', async () => {
  efx.account.unlock('password')

  const apiResponse = [[1234], [1235]]

  nock('https://test.ethfinex.com')
    .post('/trustless/v1/r/orders', (body) => {
      assert.ok(body.nonce)
      assert.ok(body.signature)

      assert.equal(body.protocol, '0x')

      // sign the nonce from scratched
      let toSign = body.nonce.toString(16)

      const recovered = ecRecover(toSign, body.signature)

      assert.equal(efx.get('account').toLowerCase(), recovered.toLowerCase())

      return true
    })
    .reply(200, apiResponse)

  const response = await efx.getOrders()

  assert.deepEqual(response, apiResponse)
})

it('efx.getOrderHist(null, null, nonce, signature)', async () => {
  efx.account.unlock('password')

  const nonce = ((Date.now() / 1000) + 60 * 60 * 24) + ''
  const signature = await efx.sign(nonce.toString(16))

  const httpResponse = [{ _id: '5b56333fd952c07b351c5940',
    id: '1151079509',
    type: 'EXCHANGE LIMIT',
    pair: 'ETHUSD',
    status: 'CANCELED',
    created_at: '2018-07-21 16:15:58',
    updated_at: '2018-07-23 19:52:51',
    user_id: 5,
    amount: '-0.10000000',
    price: '10000.00000000',
    originalamount: '-0.10000000',
    routing: 'BFX',
    lockedperiod: 0,
    trailingprice: '0.00000000',
    hidden: 0,
    vir: 0,
    maxrate: '0.00000000000000000000',
    placed_id: null,
    placed_trades: null,
    nopayback: null,
    avg_price: '0.00000000000000000000',
    active: 0,
    fiat_currency: 'USD',
    cid: '58558087372',
    cid_date: '2018-07-21',
    mseq: '2',
    gid: null,
    flags: null,
    price_aux_limit: '0.00000000',
    type_prev: null,
    tif: '3570',
    v_pair: 'ETHUSD',
    meta:
     { '$F15': 1,
       auth: '0x97ebb3391b30f495ce8cb97857db9b72d3e9dbcb' },
    symbol: 'tETHUSD',
    t: 1532375571000 },
  { _id: '5b56333fd952c07b351c593f',
    id: '1151079508',
    type: 'EXCHANGE LIMIT',
    pair: 'ETHUSD',
    status: 'CANCELED',
    created_at: '2018-07-21 16:15:53',
    updated_at: '2018-07-23 19:52:51',
    user_id: 5,
    amount: '-0.10000000',
    price: '10000.00000000',
    originalamount: '-0.10000000',
    routing: 'BFX',
    lockedperiod: 0,
    trailingprice: '0.00000000',
    hidden: 0,
    vir: 0,
    maxrate: '0.00000000000000000000',
    placed_id: null,
    placed_trades: null,
    nopayback: null,
    avg_price: '0.00000000000000000000',
    active: 0,
    fiat_currency: 'USD',
    cid: '58552546110',
    cid_date: '2018-07-21',
    mseq: '2',
    gid: null,
    flags: null,
    price_aux_limit: '0.00000000',
    type_prev: null,
    tif: '3570',
    v_pair: 'ETHUSD',
    meta:
     { '$F15': 1,
       auth: '0x97ebb3391b30f495ce8cb97857db9b72d3e9dbcb' },
    symbol: 'tETHUSD',
    t: 1532375571000
  }]

  nock('https://test.ethfinex.com')
    .post('/trustless/v1/r/orders/hist', (body) => {
      assert.equal(body.nonce, nonce)
      assert.equal(body.signature, signature)

      return true
    })
    .reply(200, httpResponse)

  const response = await efx.getOrdersHist(null, null, nonce, signature)

  assert.deepEqual(response, httpResponse)
})

it("efx.releaseTokens('USD')", async () => {
  const token = 'USD'

  nock('https://test.ethfinex.com')
    .post('/trustless/v1/w/releaseTokens', async (body) => {
      assert.ok(body.nonce)
      assert.ok(body.signature)
      assert.equal(body.tokenAddress, efx.config['0x'].tokenRegistry[token].wrapperAddress)

      return true
    })
    .reply(200, {
      status: 'success',
      releaseSignature: '0x...'
    })

  // REVIEW: releaseTokens still timing out
  // need to actually test it
  const response = await efx.releaseTokens(token)

  assert.ok(response.releaseSignature)
  assert.equal(response.status, 'success')
})

it('efx.submitOrder(ETHUSD, 1, 100)', async () => {
  nock('https://test.ethfinex.com')
    .post('/trustless/v1/w/on', async (body) => {
      assert.equal(body.type, 'EXCHANGE LIMIT')
      assert.equal(body.symbol, 'tETHUSD')
      assert.equal(body.amount, -0.1)
      assert.equal(body.price, 1000)
      assert.equal(body.protocol, '0x')

      const {meta} = body

      // TODO: actually hash the signature the same way and make
      // and test it instead of simply check if it exists
      assert.ok(meta.ecSignature)

      return true
    })
    .reply(200, { all: 'good' })

  const symbol = 'ETHUSD'
  const amount = -0.1
  const price = 1000

  const response = await efx.submitOrder(symbol, amount, price)

  // TODO:
  // - record real response using nock.recorder.rec()
  // - validate the actual response
  assert.ok(response)
})

it('efx.submitSignedOrder(order)', async () => {
  await efx.account.unlock('password')

  // TODO: move tests with mocks to individual files, probably inside of
  // test/http/ folder
  const httpResponse = [[1234]]

  nock('https://test.ethfinex.com')
    .post('/trustless/v1/w/on', async (body) => {
      assert.equal(body.type, 'EXCHANGE LIMIT')
      assert.equal(body.symbol, 'tETHUSD')
      assert.equal(body.amount, -0.1)
      assert.equal(body.price, 10000)
      assert.equal(body.protocol, '0x')

      const {meta} = body

      // TODO: actually hash the signature the same way and make
      // and test it instead of simply check if it exists
      assert.ok(meta.ecSignature)

      return true
    })
    .reply(200, httpResponse)

  const symbol = 'ETHUSD'
  const amount = -0.1
  const price = 10000

  const order = await efx.contract.createOrder(symbol, amount, price)

  const signedOrder = await efx.sign.order(order)

  const response = await efx.submitOrder(symbol, amount, price, null, null, signedOrder)

  // TODO:
  // - record real response using nock.recorder.rec()
  // - validate the actual response
  assert.ok(response)
})
