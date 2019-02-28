pragma solidity 0.4.24;

import './zeppelin/token/StandardTokenOld.sol';

contract TestTokenOld is StandardTokenOld {

    /*
    *  Token meta data
    */
    string constant public name = "Test Token Old";
    string constant public symbol = "TEST";
    uint8 constant public decimals = 18;
    uint public totalSupply = 10**27; // 1 billion tokens, 18 decimal places

    function TestTokenOld() {
        balances[msg.sender] = totalSupply;
    }
}
