require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    opBNBTestnet: {
      url: "https://opbnb-testnet-rpc.bnbchain.org",
      accounts: ["87117ab7b5bedc4ff6487fde37c54b025ba0478f64a8e167bfde4e7b827d09d4"],
      chainId: 5611,
    },
    opbnbTestnet: {
      url: "https://opbnb-testnet-rpc.bnbchain.org",
      accounts: ["87117ab7b5bedc4ff6487fde37c54b025ba0478f64a8e167bfde4e7b827d09d4"],
      chainId: 5611,
    },
  },
};
