pragma solidity 0.4.24;

import './zeppelin/token/StandardToken.sol';

contract TestToken is StandardToken {

    /*
    *  Token meta data
    */
    string public name;
    string public symbol;
    uint8 public decimals;
    uint public totalSupply = 10**27; // 1 billion tokens, 18 decimal places

    function TestToken(string _name, string _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        balances[msg.sender] = totalSupply;
    }
}
