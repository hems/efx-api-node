/* global it, contract, artifacts, assert, web3 */
const TokenTransferProxy = artifacts.require('./TokenTransferProxy.sol')
const Exchange = artifacts.require('./Exchange.sol')
const WrapperLock = artifacts.require('./WrapperLock.sol')
const WrapperLockEth = artifacts.require('./WrapperLockEth.sol')
const TestToken = artifacts.require('./TestToken.sol')

const {getTime, mineBlock, timeJump, solSha3} = require('./utils.js')

contract('Exchange', function (accounts) {
  it('set up the modified 0x exchange and proxy', async function () {
    const exchange = await Exchange.new()
    const proxy = await exchange.TOKEN_TRANSFER_PROXY_CONTRACT()
    const test = await TestToken.new()
    const wrap = await WrapperLock.new(test.address, 'tst lock', 'lTST', 18, proxy, false)
    await test.approve(wrap.address, 100)
    await wrap.deposit(100, 100, {from: accounts[0]})
    const balance = await wrap.balanceOf(accounts[0])
    assert.equal(balance.toNumber(), 100, 'Incorrect balance')
    const proxyAllowance = await wrap.allowance(accounts[0], proxy)
    assert.equal(proxyAllowance, 2 ** 256 - 1, 'Proxy not approved')
    const otherAllowance = await wrap.allowance(accounts[0], accounts[5])
    assert.equal(otherAllowance, 0, 'Other account can transfer!')
  })

  it('test fill', async function () {
    const exchange = await Exchange.new()
    const proxy = await exchange.TOKEN_TRANSFER_PROXY_CONTRACT()
    const test = await TestToken.new()
    const wrap = await WrapperLock.new(test.address, 'tst lock', 'lTST', 18, proxy, false, {from: accounts[1]})
    const wrapEth = await WrapperLockEth.new('tst eth lock', 'lETH', 18, proxy, {from: accounts[1]})
    await test.transfer(accounts[2], 100)
    await test.approve(wrap.address, 100, {from: accounts[2]})
    await wrap.deposit(100, 100, {from: accounts[2]})
    await wrapEth.deposit(0, 10, {from: accounts[1], value: web3.toWei(1, 'ether')})
    const balance = await wrap.balanceOf(accounts[2])
    assert.equal(balance.toNumber(), 100, 'Incorrect balance token wrap')
    const balanceEth = await wrapEth.balanceOf(accounts[1])
    assert.equal(balanceEth.valueOf(), web3.toWei(1, 'ether'), 'Incorrect balance ether wrap')

    const orderAddresses = [accounts[2], accounts[1], wrap.address, wrapEth.address, accounts[9]]
    const now = await getTime()
    const orderValues = [50, web3.toWei(0.5, 'ether'), 0, 0, now + 10 * 60 * 60, 0]
    const dataToSign = await exchange.getOrderHash(orderAddresses,orderValues)
    let sig = web3.eth.sign(accounts[1], dataToSign)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = '0x' + sig.substr(130, 2)
    await exchange.fillOrder(orderAddresses, orderValues, web3.toWei(0.5, 'ether'),false, v, r, s, {from: accounts[1]})
  })
})
