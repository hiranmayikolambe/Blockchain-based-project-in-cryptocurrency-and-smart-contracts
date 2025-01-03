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