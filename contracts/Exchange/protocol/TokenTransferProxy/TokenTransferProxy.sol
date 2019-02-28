pragma solidity 0.4.24;

import { Token } from "../../tokens/Token/Token.sol";

/*

  Copyright Ethfinex Inc 2018

  Licensed under the Apache License, Version 2.0
  http://www.apache.org/licenses/LICENSE-2.0

*/

//solhint-disable-next-line
/// @title TokenTransferProxy - Transfers tokens on behalf of exchange
/// @author Ahmed Ali <Ahmed@bitfinex.com>
contract TokenTransferProxy {

    modifier onlyExchange {
        require(msg.sender == exchangeAddress);
        _;
    }

    address public exchangeAddress;


    event LogAuthorizedAddressAdded(address indexed target, address indexed caller);

    function TokenTransferProxy() public {
        setExchange(msg.sender);
    }
    /*
     * Public functions
     */

    /// @dev Calls into ERC20 Token contract, invoking transferFrom.
    /// @param token Address of token to transfer.
    /// @param from Address to transfer token from.
    /// @param to Address to transfer token to.
    /// @param value Amount of token to transfer.
    /// @return Success of transfer.
    function transferFrom(
        address token,
        address from,
        address to,
        uint value)
        public
        onlyExchange
        returns (bool)
    {
        return Token(token).transferFrom(from, to, value);
    }

    /// @dev Used to set exchange address
    /// @param _exchange the address of the exchange
    function setExchange(address _exchange) internal {
        require(exchangeAddress == address(0));
        exchangeAddress = _exchange;
    }
}
