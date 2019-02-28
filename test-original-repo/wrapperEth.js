/* global it, contract, artifacts, assert, web3 */
const WrapperLockEth = artifacts.require('./WrapperLockEth.sol')
const TestToken = artifacts.require('./TestToken.sol')
const TestTokenOld = artifacts.require('./TestTokenOld.sol')

const {getTime, mineBlock, timeJump, expectThrow} = require('./utils.js')

contract('WrapperLockEth', function (accounts) {
  it('should not be possible to lock up some ethers for less than 1 hour', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0000000000000000000000000000000000000000)
    await expectThrow(wrap.deposit(0, 0, {from: accounts[0], value: web3.toWei(1, 'ether')}))
  })

  it('should not be possible to lock up some ethers if deposit time is less than deposit lock', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0000000000000000000000000000000000000000)
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await expectThrow(wrap.deposit(0, 1, {from: accounts[0], value: web3.toWei(1, 'ether')}))
  })

  it('should be possible to lock up some ethers', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[0]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    const durationLocked = await wrap.depositLock.call(accounts[0])
    assert.equal(durationLocked.valueOf(), (await getTime()) + 10 * 60 * 60, 'Lock time incorrect')
    const balance = await wrap.balanceOf(accounts[0])
    assert.equal(balance.valueOf(), web3.toWei(1, 'ether'), 'Incorrect balance')
  })

  it('should not be possible to withdraw ethers if value is less than balance', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[0]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await timeJump(10 * 60 * 60 + 10)
    await mineBlock()
    await expectThrow(wrap.withdraw(web3.toWei(2, 'ether'), 0, 0, 0, 0, {from: accounts[0]}))
  })

  it('should not be possible to unlock ethers without signature', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[0]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await expectThrow(wrap.withdraw(web3.toWei(1, 'ether'), 0, 0, 0, 0, {from: accounts[0]}))
  })

  it('should be possible to withdraw the ether', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[0]})
    const startingEth = (await web3.eth.getBalance(accounts[0])).toNumber()
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await timeJump(10 * 60 * 60 + 10)
    await mineBlock()
    await wrap.withdraw(web3.toWei(1, 'ether'), 0, 0, 0, 0, {from: accounts[0]})
    const endingEth = (await web3.eth.getBalance(accounts[0])).toNumber()
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Wrapper balance not updated')
    assert.approximately(endingEth, startingEth, startingEth * 0.001, web3.fromWei(startingEth - endingEth, 'ether') + 'Ether not returned')
  })

  it('should not be possible to unlock ethers if block number is greater than signature valid block', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[0]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    let unlockUntilBlockNum = web3.eth.blockNumber
    let dataToSign = await wrap.keccak(accounts[0], wrap.address, unlockUntilBlockNum)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = web3.toDecimal(sig.substr(130, 2)) + 27
    await expectThrow(wrap.withdraw(parseInt(web3.toWei(1, 'ether')), v, r, s, unlockUntilBlockNum, {from: accounts[0]}))
  })

  it('should not be possible to unlock ethers with invalid signature', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[0]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    let unlockUntilBlockNum = web3.eth.blockNumber + 10
    let dataToSign = await wrap.keccak(accounts[0], wrap.address, unlockUntilBlockNum)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    await expectThrow(wrap.withdraw(parseInt(web3.toWei(1, 'ether')), 0, r, s, unlockUntilBlockNum, {from: accounts[0]}))
  })

  it('should be possible to unlock the eth', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[0]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    let unlockUntilBlockNum = web3.eth.blockNumber + 10
    let dataToSign = await wrap.keccak(accounts[0], wrap.address, unlockUntilBlockNum)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = web3.toDecimal(sig.substr(130, 2)) + 27
    await wrap.withdraw(parseInt(web3.toWei(1, 'ether')), v, r, s, unlockUntilBlockNum, {from: accounts[0]})
    assert.equal(await wrap.isValidSignature(dataToSign, v, r, s), true, 'Incorrect signature')
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Token balance not updated')
  })


  it('should not be possible to transferFrom one address to another if none of them are owner', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, accounts[2], {from: accounts[3]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await expectThrow(wrap.transferFrom(accounts[0], accounts[1], 100, {from: accounts[2]}))
  })

  it('should not be possible for non TRANSFER_PROXY to transferFrom', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[0]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await expectThrow(wrap.transferFrom(wrap.address, accounts[0], 100, {from: accounts[0]}))
  })

  it('should not be possible for TRANSFER_PROXY to transferFrom from address to owner if value is greater than balance', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, accounts[2], {from: accounts[0]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await expectThrow(wrap.transferFrom(accounts[0], accounts[3], web3.toWei(2, 'ether'), {from: accounts[2]}))
  })

  it('should be possible for TRANSFER_PROXY to transferFrom from address to owner', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, accounts[2], {from: accounts[3]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await wrap.transferFrom(accounts[0], accounts[3], web3.toWei(1, 'ether'), {from: accounts[2]})
    assert.equal((await wrap.balanceOf(accounts[3])).valueOf(), web3.toWei(1, 'ether'), 'Incorrect balance')
  })

  it('should be possible to add a newSigner', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, accounts[2], {from: accounts[3]})
    assert.equal((await wrap.isSigner.call(accounts[3])).valueOf(), true, 'No initial signer')
    await wrap.addSigner(accounts[9], {from: accounts[3]})
    assert.equal((await wrap.isSigner.call(accounts[9])).valueOf(), true, 'New signer not added')
  })

  it('should be possible for TRANSFER_PROXY to transferFrom from address to newSigner', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, accounts[2], {from: accounts[3]})
    await wrap.addSigner(accounts[9], {from: accounts[3]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await wrap.transferFrom(accounts[0], accounts[9], 100, {from: accounts[2]})
    assert.equal((await wrap.balanceOf(accounts[9])).valueOf(), 100, 'Incorrect balance')
  })

  it('should be possible for TRANSFER_PROXY to transferFrom from address to newSigner and back', async function () {
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, accounts[2], {from: accounts[3]})
    await wrap.addSigner(accounts[9], {from: accounts[3]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await wrap.transferFrom(accounts[0], accounts[9], 100, {from: accounts[2]})
    assert.equal((await wrap.balanceOf(accounts[9])).valueOf(), 100, 'Incorrect balance')
    await wrap.transferFrom(accounts[9], accounts[0], 100, {from: accounts[2]})
    assert.equal((await wrap.balanceOf(accounts[9])).valueOf(), 0, 'Incorrect balance')
  })

  it('should not be possible for owner to withdraw different token when different token balance is 0', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[0]})
    await expectThrow(wrap.withdrawDifferentToken(test.address, false, {from: accounts[1]}))
  })

  it('should not be possible for non owner to withdraw different token', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[1]})
    const startingToken = (await test.balanceOf(accounts[0])).toNumber()
    await test.transfer(wrap.address, web3.toWei(1, 'ether'))
    assert.equal((await test.balanceOf(accounts[0])).valueOf(), startingToken - web3.toWei(1, 'ether'))
    await expectThrow(wrap.withdrawDifferentToken(test.address, false, {from: accounts[0]}))
  })

  it('should be possible for owner to withdraw different token', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[1]})
    await test.transfer(wrap.address, web3.toWei(1, 'ether'))
    await wrap.withdrawDifferentToken(test.address, false, {from: accounts[1]})
    assert.equal((await test.balanceOf(accounts[1])).valueOf(), web3.toWei(1, 'ether'))
  })

  it('should be possible for owner to withdraw different old token', async function () {
    const test = await TestTokenOld.new({from: accounts[0]})
    const wrap = await WrapperLockEth.new('WrappedEther', 'WETH', 18, 0x0, {from: accounts[1]})
    await test.transfer(wrap.address, web3.toWei(1, 'ether'))
    await wrap.withdrawDifferentToken(test.address, true, {from: accounts[1]})
    assert.equal((await test.balanceOf(accounts[1])).valueOf(), web3.toWei(1, 'ether'))
  })
})
