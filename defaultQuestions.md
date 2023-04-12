0) Give a bullet point overview of the system.
   ```- Streamlined trading of native ETH-based tokens
- Routing various order types to multiple pools
- Handling NFT transfers and royalty fees
- Ensuring deadline compliance and surplus ETH refunds
- Customizable NFT Automated Market Maker smart contract
- Facilitates trading, depositing, and withdrawing of NFTs and base tokens
- Earning fees from trading activities
- Advanced features like concentrated liquidity and custom fee rates
- Stolen NFT filtering to prevent trading of stolen assets
- Support for royalties and flash loans in the DeFi ecosystem```
1) What access control mechanisms are in place?
   ```The access control mechanism in place is the `onlyOwner` modifier. This modifier checks if the sender of the transaction (`msg.sender`) is the owner of the contract by comparing it with the owner returned by the `Factory(factory).ownerOf(uint160(address(this)))` function call. If the sender is not the owner, the modifier will revert the transaction with an "Unauthorized" error message. The `virtual` keyword indicates that this modifier can be overridden in derived contracts.```
2) For each smart contract, give a bullet point overview.
   ```1. Private Pool:
   - Customizable NFT Automated Market Maker smart contract
   - Facilitates trading, depositing, and withdrawing of NFTs and base tokens
   - Allows users to earn fees
   - Offers advanced features like concentrated liquidity, custom fee rates, stolen NFT filtering
   - Supports royalties and flash loans

2. Eth Router:
   - Streamlines trading of native ETH-based tokens
   - Routes various order types to multiple pools
   - Handles NFT transfers and royalty fees
   - Ensures deadline compliance and surplus ETH refunds

3. Caviar Private Pool Factory:
   - Facilitates creation and initialization of private pools
   - Mints NFTs for creators
   - Handles protocol fees
   - Deploys pool clones
   - Manages private pool metadata, implementation contracts, and fee rates
   - Enables withdrawal of earned fees and prediction of deployment addresses for new pools```
3) What modifiers are used in each contract?
   ```In the provided code snippets, there is only one modifier mentioned:

1. `modifier onlyOwner() virtual`: This modifier is used in the Private Pool contract. It restricts access to certain functions within the contract by checking if the sender of the transaction (`msg.sender`) is the owner of the contract. If the sender is not the owner, the modifier will revert the transaction with an "Unauthorized" error message. The `virtual` keyword indicates that this modifier can be overridden in derived contracts.```
