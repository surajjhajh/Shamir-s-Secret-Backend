import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { HDNodeWallet } from "ethers";
import { split, combine, } from "shamir-secret-sharing";

const mnemonic = generateMnemonic();
console.log(mnemonic);

const seedPhrase = mnemonicToSeedSync(mnemonic);
console.log(seedPhrase)

const path = "m/44'/60'/0'/0/0";

const hdNode = HDNodeWallet.fromSeed(seedPhrase);
const childNode = hdNode.derivePath(path)
const ethereumAddress = childNode.address;
const privateKey = childNode.privateKey;
const publicKey = childNode.publicKey;
console.log("Ethereum Address: ", ethereumAddress);
console.log("Private Key: ", privateKey);
console.log("Public Key: ", publicKey);


async function shamirsSecretPrivateKey() {
    const encoder = new TextEncoder();
    const privateKeyUintArray = encoder.encode(privateKey);

    const [share1, share2, share3, share4, share5] = await split(privateKeyUintArray, 5, 3);

    const getPrivateKey = await combine([share1, share2, share3]);
    console.log(getPrivateKey)

    const decoder = new TextDecoder();
    const decodedPrivateKey = decoder.decode(getPrivateKey);
    console.log(decodedPrivateKey);
}

shamirsSecretPrivateKey();