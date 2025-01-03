const MyToken = artifacts.require("MyToken");
const TokenSale = artifacts.require("TokenSale");

module.exports = async function (deployer) {
    const initialSupply = web3.utils.toWei('1000000', 'ether'); // 1 million tokens
    await deployer.deploy(MyToken, initialSupply);
    const tokenInstance = await MyToken.deployed();

    const tokenPrice = web3.utils.toWei('0.01', 'ether'); // Price per token
    await deployer.deploy(TokenSale, tokenInstance.address, tokenPrice);
};