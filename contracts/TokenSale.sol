// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MyToken.sol";

contract TokenSale {
    address payable admin;
    MyToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address _buyer, uint256 _amount);

    constructor(MyToken _tokenContract, uint256 _tokenPrice) {
        admin = payable(msg.sender);
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        require(msg.value == _numberOfTokens * tokenPrice, "Incorrect Ether value sent");
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens, "Not enough tokens in the reserve");
        require(tokenContract.transfer(msg.sender, _numberOfTokens), "Transfer failed");

        tokensSold += _numberOfTokens;
        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        require(msg.sender == admin, "Only admin can end the sale");
        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))), "Transfer failed");
        selfdestruct(admin);
    }
}