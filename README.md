# Blockchain-Based Cryptocurrency and Smart Contracts Project

## Project Overview
This project implements a blockchain-based application featuring an ERC20 token and a token sale contract. The project is built using Ethereum's Solidity programming language for smart contracts and JavaScript for interacting with the blockchain.

### Components:
1. **ERC20 Token**: A standard token that supports transfer operations between users.
2. **Token Sale Contract**: A contract allowing users to buy tokens with Ether.

---

## Prerequisites
Before proceeding, ensure the following tools and frameworks are installed:

- [Node.js](https://nodejs.org/) and npm
- [Truffle Framework](https://trufflesuite.com/)
- [Ganache](https://trufflesuite.com/ganache/) for local blockchain development
- [MetaMask](https://metamask.io/) for blockchain interaction

---

## Project Setup

### 1. Create the Project Directory
```bash
mkdir CryptoTokenProject
cd CryptoTokenProject
```

### 2. Initialize a Truffle Project
```bash
truffle init
```

### 3. Install Dependencies
Install OpenZeppelin Contracts:
```bash
npm install @openzeppelin/contracts
```

---

## Development Steps

### Step 1: Create the ERC20 Token Contract
Create a file named `MyToken.sol` in the `contracts` directory.
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

### Step 2: Create the Token Sale Contract
Create a file named `TokenSale.sol` in the `contracts` directory.
```solidity
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
```

### Step 3: Migrate the Contracts
Create a file named `2_deploy_contracts.js` in the `migrations` directory.
```javascript
const MyToken = artifacts.require("MyToken");
const TokenSale = artifacts.require("TokenSale");

module.exports = async function (deployer) {
    const initialSupply = web3.utils.toWei('1000000', 'ether'); // 1 million tokens
    await deployer.deploy(MyToken, initialSupply);
    const tokenInstance = await MyToken.deployed();

    const tokenPrice = web3.utils.toWei('0.01', 'ether'); // Price per token
    await deployer.deploy(TokenSale, tokenInstance.address, tokenPrice);
};
```

### Step 4: Configure Truffle
Edit `truffle-config.js` to configure the development network (Ganache):
```javascript
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
    },
  },
  compilers: {
    solc: {
      version: "0.8.0", // Specify the Solidity version
    },
  },
};
```

### Step 5: Compile and Migrate the Contracts
Start Ganache, then execute the following commands:

Compile the contracts:
```bash
truffle compile
```

Migrate the contracts:
```bash
truffle migrate
```

---

## Interacting with the Contracts

### Create an Interaction Script
Create a file named `interact.js`:
```javascript
const Web3 = require('web3');
const MyToken = require('./build/contracts/MyToken.json');
const TokenSale = require('./build/contracts/TokenSale.json');

const web3 = new Web3('http://127.0.0.1:7545'); // Connect to Ganache

const init = async () => {
    const accounts = await web3.eth.getAccounts();
    const tokenSale = new web3.eth.Contract(TokenSale.abi, 'YOUR_TOKEN_SALE_CONTRACT_ADDRESS');
    const token = new web3.eth.Contract(MyToken.abi, 'YOUR_TOKEN_CONTRACT_ADDRESS');

    // Check token balance of the contract
    const balance = await token.methods.balanceOf(tokenSale.options.address).call();
    console.log(`Token Sale Contract Balance: ${web3.utils.fromWei(balance, 'ether')} MTK`);

    // Buy tokens
    const tokensToBuy = 10; // Number of tokens to buy
    const tokenPrice = await tokenSale.methods.tokenPrice().call();
    const value = tokenPrice * tokensToBuy;

    await tokenSale.methods.buyTokens(tokensToBuy).send({ from: accounts[0], value: value });
    console.log(`Bought ${tokensToBuy} tokens`);

    // Check new balance
    const newBalance = await token.methods.balanceOf(accounts[0]).call();
    console.log(`New Balance: ${web3.utils.fromWei(newBalance, 'ether')} MTK`);
};

init().catch(console.error);
```

### Run the Script
Execute the script to interact with the contracts:
```bash
node interact.js
```

---

## Testing the Contracts

### Write Tests
Create a file named `TokenSale.test.js` in the `test` directory:
```javascript
const MyToken = artifacts.require("MyToken");
const TokenSale = artifacts.require("TokenSale");

contract("TokenSale", (accounts) => {
    let tokenInstance;
    let tokenSaleInstance;
    const tokenPrice = web3.utils.toWei('0.01', 'ether');
    const tokensAvailable = 1000000;

    before(async () => {
        tokenInstance = await MyToken.new(tokensAvailable);
        tokenSaleInstance = await TokenSale.new(tokenInstance.address, tokenPrice);
        await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable);
    });

    it("should have the correct token price", async () => {
        const price = await tokenSaleInstance.tokenPrice();
        assert.equal(price.toString(), tokenPrice, "Token price is incorrect");
    });

    it("should allow users to buy tokens", async () => {
        const numberOfTokens = 10;
        const value = numberOfTokens * tokenPrice;

        const receipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from: accounts[1], value: value });
        const event = receipt.logs[0].event;

        assert.equal(event, "Sell", "Sell event was not emitted");
        
        const balance = await tokenInstance.balanceOf(accounts[1]);
        assert.equal(balance.toString(), web3.utils.toWei(numberOfTokens.toString(), 'ether'), "User should have received tokens");
    });
});
```

### Run Tests
Run the tests with the following command:
```bash
truffle test
```

---

## Deployment to Test Networks

### Set Up Infura and HDWalletProvider
Install HDWalletProvider:
```bash
npm install @truffle/hdwallet-provider
```

Update `truffle-config.js` to include the test network configuration:
```javascript
const HDWalletProvider = require('@truffle/hdwallet-provider');
const infuraKey = "YOUR_INFURA_KEY";
const mnemonic = "YOUR_MNEMONIC";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraKey}`),
      network_id: 4,
      gas: 5500000,
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",
    },
  },
};
```

### Deploy to Rinkeby
Run the following command:
```bash
truffle migrate --network rinkeby
```

---

## Conclusion
This project demonstrates how to create a basic ERC20 token and a token sale contract. The framework can be expanded with advanced tokenomics, user authentication, front-end integration, or dApp functionality. Always ensure security audits and thorough testing before deploying to the mainnet.

