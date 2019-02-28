/* global it, contract, artifacts, assert, web3 */
const WrapperLock = artifacts.require('./WrapperLock.sol')
const TestToken = artifacts.require('./TestToken.sol')
const TestTokenOld = artifacts.require('./TestTokenOld.sol')

const {getTime, mineBlock, timeJump, solSha3, expectThrow} = require('./utils.js')

contract('WrapperLock', function (accounts) {
  it('should not be possible to lock up some test tokens for less than 1 hour', async function () {
    const test = await TestToken.new()

    console.log( "test address ->", test.address )

    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false)
    await expectThrow(wrap.deposit(100, 0, {from: accounts[0]}))
  })

  it('should not be possible to lock up test tokens you do not have', async function () {
    const test = await TestToken.new()
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false)
    await expectThrow(wrap.deposit(100, 10, {from: accounts[0]}))
  })

  it('should not be possible to lock up some test tokens if deposit time is less than deposit lock', async function () {
    const test = await TestToken.new()
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false)
    await test.approve(wrap.address, 200)
    await wrap.deposit(100, 10, {from: accounts[0]})
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 100, 'Incorrect balance')
    await expectThrow(wrap.deposit(100, 1, {from: accounts[0]}))
  })

  it('should be possible to lock up some test token', async function () {
    const test = await TestToken.new()
    const wrap = await WrapperLock.new(test.address, 'test lock', 'lTST', 18, "0x0000000000000000000000000000000000000000", false)
    await test.approve(wrap.address, 100)
    await wrap.deposit(100, 10, {from: accounts[0]})
    const durationLocked = await wrap.depositLock.call(accounts[0])
    assert.equal(durationLocked.valueOf(), (await getTime()) + 10 * 60 * 60, 'Lock time incorrect')
    const balance = await wrap.balanceOf(accounts[0])
    assert.equal(balance.toNumber(), 100, 'Incorrect balance')
  })

  it('should be possible to lock up some old test token', async function () {
    const test = await TestTokenOld.new()
    const wrap = await WrapperLock.new(test.address, 'test lock', 'lTST', 18, "0x0000000000000000000000000000000000000000", true)
    await test.approve(wrap.address, 100)
    await wrap.deposit(100, 10, {from: accounts[0]})
    const durationLocked = await wrap.depositLock.call(accounts[0])
    assert.equal(durationLocked.valueOf(), (await getTime()) + 10 * 60 * 60, 'Lock time incorrect')
    const balance = await wrap.balanceOf(accounts[0])
    assert.equal(balance.toNumber(), 100, 'Incorrect balance')
  })

  it('should not be possible to withdraw tokens if value is less than balance', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[0]})
    await test.approve(wrap.address, 100)
    await wrap.deposit(100, 10, {from: accounts[0]})
    await timeJump(10 * 60 * 60 + 10)
    await mineBlock()
    await expectThrow(wrap.withdraw(200, 0, 0, 0, 0, {from: accounts[0]}))
  })

  return

  it('should not be possible to unlock tokens without signature', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    await expectThrow(wrap.withdraw(100, 0, 0, 0, 0, {from: accounts[0]}))
  })

  it('should not be possible to unlock tokens if block number is greater than signature valid block', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    const unlockUntilBlockNum = web3.eth.blockNumber
    let dataToSign = await wrap.keccak(accounts[0], wrap.address, unlockUntilBlockNum)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = web3.toDecimal(sig.substr(130, 2)) + 27
    await expectThrow(wrap.withdraw(100, v, r, s, unlockUntilBlockNum, {from: accounts[0]}))
  })

  it('should not be possible to unlock tokens with invalid signature', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    const unlockUntilBlockNum = web3.eth.blockNumber + 100
    let dataToSign = await wrap.keccak(accounts[0], wrap.address, unlockUntilBlockNum)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    await expectThrow(wrap.withdraw(100, 0, r, s, unlockUntilBlockNum, {from: accounts[0]}))
  })

  it('generates valid signatures', async function () {
    const wrap = await WrapperLock.deployed()
    let dataToSign = await wrap.keccak(accounts[0], 1, 1)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = web3.toDecimal(sig.substr(130, 2)) + 27
    assert.equal(await wrap.isValidSignature(dataToSign, v, r, s), true, 'Incorrect signature')
    assert.equal(await wrap.keccak(accounts[0], accounts[1], 1), solSha3(accounts[0], accounts[1], 1), 'web3.sha3 did not match keccak')
    // web3.sha3 and keccack256 aren't matching up
  })

  it('should be possible to withdraw the tokens', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'test lock', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    const startingToken = (await test.balanceOf(accounts[0])).toNumber()
    await timeJump(10 * 60 * 60 + 10)
    await mineBlock()
    await wrap.withdraw(100, 0, 0, 0, 0, {from: accounts[0]})
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Token balance not updated')
    assert.equal((await test.balanceOf(accounts[0])).valueOf(), 100 + startingToken)
  })

  it('should be possible to withdraw the old tokens', async function () {
    const test = await TestTokenOld.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'test lock', 'lTST', 18, "0x0000000000000000000000000000000000000000", true, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    const startingToken = (await test.balanceOf(accounts[0])).toNumber()
    await timeJump(10 * 60 * 60 + 10)
    await mineBlock()
    await wrap.withdraw(100, 0, 0, 0, 0, {from: accounts[0]})
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Token balance not updated')
    assert.equal((await test.balanceOf(accounts[0])).valueOf(), 100 + startingToken)
  })

  it('should be possible to unlock the tokens', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'test lock', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    const startingToken = (await test.balanceOf(accounts[0])).toNumber()
    const unlockUntilBlockNum = web3.eth.blockNumber + 100
    let dataToSign = await wrap.keccak(accounts[0], wrap.address, unlockUntilBlockNum)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    // console.log(sig)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = web3.toDecimal(sig.substr(130, 2)) + 27
    // console.log('r: ', r, 's: ', s, 'v: ', v)
    await wrap.withdraw(100, v, r, s, unlockUntilBlockNum, {from: accounts[0]})
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Token balance not updated')
    assert.equal((await test.balanceOf(accounts[0])).valueOf(), 100 + startingToken)
  })

  it('should be possible to unlock the old tokens', async function () {
    const test = await TestTokenOld.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'test lock', 'lTST', 18, "0x0000000000000000000000000000000000000000", true, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    const startingToken = (await test.balanceOf(accounts[0])).toNumber()
    const unlockUntilBlockNum = web3.eth.blockNumber + 100
    let dataToSign = await wrap.keccak(accounts[0], wrap.address, unlockUntilBlockNum)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    // console.log(sig)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = web3.toDecimal(sig.substr(130, 2)) + 27
    // console.log('r: ', r, 's: ', s, 'v: ', v)
    await wrap.withdraw(100, v, r, s, unlockUntilBlockNum, {from: accounts[0]})
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Token balance not updated')
    assert.equal((await test.balanceOf(accounts[0])).valueOf(), 100 + startingToken)
  })

  it('should not be possible to transferFrom one address to another if none of them are owner', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, accounts[2], false, {from: accounts[3]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    await expectThrow(wrap.transferFrom(accounts[0], accounts[1], 100, {from: accounts[2]}))
  })

  it('should not be possible for non TRANSFER_PROXY to transferFrom', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    await expectThrow(wrap.transferFrom(wrap.address, accounts[0], 100, {from: accounts[0]}))
  })

  it('should not be possible for TRANSFER_PROXY to transferFrom from address to owner if value is greater than balance', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, accounts[2], false, {from: accounts[3]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    await expectThrow(wrap.transferFrom(accounts[0], accounts[3], 200, {from: accounts[2]}))
  })

  it('should be possible for TRANSFER_PROXY to transferFrom from address to owner', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, accounts[2], false, {from: accounts[3]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    await wrap.transferFrom(accounts[0], accounts[3], 100, {from: accounts[2]})
    assert.equal((await wrap.balanceOf(accounts[3])).valueOf(), 100, 'Incorrect balance')
  })

  it('should be possible to add a newSigner', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, accounts[2], false, {from: accounts[3]})
    assert.equal((await wrap.isSigner.call(accounts[3])).valueOf(), true, 'No initial signer')
    await wrap.addSigner(accounts[9], {from: accounts[3]})
    assert.equal((await wrap.isSigner.call(accounts[9])).valueOf(), true, 'New signer not added')
  })

  it('should be possible for TRANSFER_PROXY to transferFrom from address to newSigner', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, accounts[2], false, {from: accounts[3]})
    await wrap.addSigner(accounts[9], {from: accounts[3]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    await wrap.transferFrom(accounts[0], accounts[9], 100, {from: accounts[2]})
    assert.equal((await wrap.balanceOf(accounts[9])).valueOf(), 100, 'Incorrect balance')
  })

  it('should not be possible for owner to withdraw original token', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[1]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    await expectThrow(wrap.withdrawDifferentToken(test.address, false, {from: accounts[1]}))
  })

  it('should not be possible for owner to withdraw different token when different token balance is 0', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const testDif = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[1]})
    await expectThrow(wrap.withdrawDifferentToken(testDif.address, false, {from: accounts[1]}))
  })

  it('should not be possible for non owner to withdraw different token', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const testDif = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[1]})
    await testDif.transfer(wrap.address, 100)
    await expectThrow(wrap.withdrawDifferentToken(testDif.address, false, {from: accounts[0]}))
  })

  it('should be possible for owner to withdraw different token', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const testDif = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[1]})
    await testDif.transfer(wrap.address, 100)
    await wrap.withdrawDifferentToken(testDif.address, false, {from: accounts[1]})
    assert.equal((await testDif.balanceOf(accounts[1])).valueOf(), 100)
  })

  it('should be possible for owner to withdraw different old token', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const testDif = await TestTokenOld.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[1]})
    await testDif.transfer(wrap.address, 100)
    await wrap.withdrawDifferentToken(testDif.address, true, {from: accounts[1]})
    assert.equal((await testDif.balanceOf(accounts[1])).valueOf(), 100)
  })

  it('should be possible for owner to withdraw balance difference when balance difference is 0', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[1]})
    await expectThrow(wrap.withdrawBalanceDifference({from: accounts[1]}))
  })

  it('should not be possible for non owner to withdraw balance difference', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[1]})
    await test.transfer(wrap.address, 100)
    await expectThrow(wrap.withdrawBalanceDifference({from: accounts[0]}))
  })

  it('should be possible for owner to withdraw balance difference', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", false, {from: accounts[1]})
    await test.approve(wrap.address, 200)
    await wrap.deposit(100, 10, {from: accounts[0]})
    await test.transfer(wrap.address, 100)
    await wrap.withdrawBalanceDifference({from: accounts[1]})
    assert.equal((await test.balanceOf(accounts[1])).valueOf(), 100)
  })

  it('should be possible for owner to withdraw balance difference for old token', async function () {
    const test = await TestTokenOld.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'WrapperToken', 'lTST', 18, "0x0000000000000000000000000000000000000000", true, {from: accounts[1]})
    await test.approve(wrap.address, 200)
    await wrap.deposit(100, 10, {from: accounts[0]})
    await test.transfer(wrap.address, 100)
    await wrap.withdrawBalanceDifference({from: accounts[1]})
    assert.equal((await test.balanceOf(accounts[1])).valueOf(), 100)
  })
})
