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