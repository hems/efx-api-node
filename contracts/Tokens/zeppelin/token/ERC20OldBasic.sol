pragma solidity 0.4.24;

/**ERC20OldBasic.sol
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 */
contract ERC20OldBasic {
  function totalSupply() public view returns (uint256);
  function balanceOf(address who) public view returns (uint256);
  function transfer(address to, uint256 value) public;
  event Transfer(address indexed from, address indexed to, uint256 value);
}