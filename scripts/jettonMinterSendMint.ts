import { Address, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { NetworkProvider } from '@ton/blueprint';

const randomSeed= Math.floor(Math.random() * 10000);
export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    //const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    //POOL_WALLET_ADDRESS=UQAYnQ0iIL3HoVDVP-RO3NDA2uWAQCR3x5qjZkNrznr-pk4g
    const toAddress = Address.parse("0QC9dDz_nvDlSI1FWTuEvk_-LqljDjtIUG4mVMUaRwO6-uMD") 
    const jettonMinterAddress = Address.parse("kQDDN_fLlwS1TRoxEZzaQVOts4YrQXRvjeU85QKx7FCaLLso");
    const jettonMinter = provider.open(JettonMinter.createFromAddress(jettonMinterAddress));
    await jettonMinter.sendMint(provider.sender(),
        toAddress,
        toNano("1000000000"),
        toNano("0.05"),
        toNano("0.1")
    )
    ui.write(`transaction sent to mint token: <https://testnet.tonscan.org/address/${jettonMinter.address}`)
}