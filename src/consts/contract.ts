// Your smart contract address (available on the thirdweb dashboard)
// For existing collections: import your existing contracts on the dashboard: https://thirdweb.com/dashboard
export const collectionContractConst = import.meta.env.VITE_COLLECTION_CONTRACT_ADDR || "0xFf901B70EB902Aefd9074e97a0BfCa933d9dE7Bb";
export const saleMinterContractConst = import.meta.env.VITE_SALEMINTER_CONTRACT_ADDR ||"0xFf901B70EB902Aefd9074e97a0BfCa933d9dE7Bb";

// The name of the chain your contract is deployed to.
// Refer to README.md on how to specify the chain name.
export const chainConst = "Immutable zkEVM";