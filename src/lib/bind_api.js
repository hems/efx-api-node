/**
 * - Creates an efx instance
 * - Load all functions from the ./api folder into this instance
 * - Binds the functions so they will always receive efx as first argument
 *
 * This way we get a regular looking API on top of functional code
 */
const _ = require('lodash')

module.exports = () => {
  const efx = {}

  // returns a function that will call api functions prepending efx
  // as first argument
  const compose = (funk) => {
    return _.partial(funk, efx)
  }

  // efx.account functions
  efx.account = {
    balance: compose(require('../api/account/balance')),
    tokenBalance: compose(require('../api/account/token_balance')),
    select: compose(require('../api/account/select')),
    unlock: compose(require('../api/account/unlock'))
  }

  // efx.contract functions
  efx.contract = {
    approve: compose(require('../api/contract/approve')),
    isApproved: compose(require('../api/contract/is_approved')),
    depositLock: compose(require('../api/contract/deposit_lock')),
    lock: compose(require('../api/contract/lock')),
    unlock: compose(require('../api/contract/unlock')),
    createOrder: compose(require('../api/contract/createOrder')),
    abi: {
      locker: require('../api/contract/abi/locker.abi.js'),
      token: require('../api/contract/abi/token.abi.js')
    }
  }

  // efx.eth functions
  efx.eth = {
    call: compose(require('../api/eth/call')),
    send: compose(require('../api/eth/send')),
    getNetwork: compose(require('../api/eth/get_network'))
  }

  // efx.sign functions
  efx.sign = compose(require('../api/sign/sign'))
  // hack to get a nice method signature
  efx.sign.order = compose(require('../api/sign/order'))
  efx.sign.cancelOrder = compose(require('../api/sign/cancel_order'))
  efx.sign.request = compose(require('../api/sign/request'))

  // efx main functions
  efx.cancelOrder = compose(require('../api/cancel_order'))
  efx.cancelSignedOrder = compose(require('../api/cancel_signed_order'))
  efx.getOrder = compose(require('../api/get_order'))
  efx.getOrderList = compose(require('../api/get_order_list'))
  efx.releaseTokens = compose(require('../api/release_tokens'))
  efx.submitOrder = compose(require('../api/submit_order'))
  efx.submitSignedOrder = compose(require('../api/submit_signed_order'))

  return efx
}
