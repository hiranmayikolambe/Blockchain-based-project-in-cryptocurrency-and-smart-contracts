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
        assert.equal(balance.toString(), web3.utils.toWei(numberOfTokens.toString(), 'ether'), "User  should have received tokens");
    });

    it("should not allow users to buy tokens with incorrect Ether value", async () => {
        try {
            await tokenSaleInstance.buyTokens(10, { from: accounts[1], value: web3.utils.toWei('0.1', 'ether') });
            assert.fail("The transaction should have thrown an error");
        } catch (error) {
            assert(error.message.includes("Incorrect Ether value sent"), "Expected error message not received");
        }
    });

    it("should end the sale and transfer remaining tokens to admin", async () => {
        const adminBalanceBefore = await tokenInstance.balanceOf(accounts[0]);
        await tokenSaleInstance.endSale({ from: accounts[0] });
        const adminBalanceAfter = await tokenInstance.balanceOf(accounts[0]);

        assert.equal(adminBalanceAfter.toString(), adminBalanceBefore.add(tokensAvailable).toString(), "Admin should receive remaining tokens");
    });
});