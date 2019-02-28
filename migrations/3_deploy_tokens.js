var WrapperLockEth = artifacts.require('./WrapperLockEth.sol')
var WrapperLock = artifacts.require('./WrapperLock.sol')
var TestToken = artifacts.require('./TestToken.sol')
var TokenTransferProxy = artifacts.require('TokenTransferProxy')

module.exports = async (deployer) => {
  await deployer.deploy(TokenTransferProxy)
  await deployer.deploy(WrapperLockEth, 'eth lock', 'lETH', 18, TokenTransferProxy.address)
  await deployer.deploy(TestToken, 'TEST', 'TST', 18)
  await deployer.deploy(WrapperLock, TestToken.address, 'tst lock', 'lTST', 18, TokenTransferProxy.address, false)
}
