const Exchange = artifacts.require('./Exchange.sol')
const WrapperLock = artifacts.require('./WrapperLock.sol')
const WrapperLockEth = artifacts.require('./WrapperLockEth.sol')
const TestToken = artifacts.require('./TestToken.sol')

/**
 * Generate a couple of Tokens and addresses
 */
let fixture = null

module.exports = async () => {

  if(fixture) return fixture;

  fixture = {}

  fixture.exchange = await Exchange.new()
  fixture.proxy = await fixture.exchange.TOKEN_TRANSFER_PROXY_CONTRACT()

  fixture.ZRX = await TestToken.new('0x', 'ZRX', 18)
  fixture.WZRX = await WrapperLock.new(fixture.ZRX.address, 'Wrapper 0x', 'WZRX', 18, fixture.proxy, false)

  fixture.USD = await TestToken.new('0x', 'USD', 18)
  fixture.WUSD = await WrapperLock.new(fixture.USD.address, 'Wrapper 0x', 'WUSD', 18, fixture.proxy, false)

  fixture.WETH = await WrapperLockEth.new('WrappedEther', 'WETH', 18, fixture.proxy)

  return fixture;
}
