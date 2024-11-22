import { Address, beginCell, toNano } from '@ton/core';
import { JettonWallet } from '../wrappers/JettonWallet';
import { NetworkProvider } from '@ton/blueprint';

const randomSeed= Math.floor(Math.random() * 10000);
export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    //const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    //const toAddress = Address.parse("0QDw0ooHZ4BsgzEkElivvhBACbTOf4KFRNBdd0_IYeBE0Rn9")
    const toAddress = Address.parse("") 
    const responseAddress = Address.parse("0QC9dDz_nvDlSI1FWTuEvk_-LqljDjtIUG4mVMUaRwO6-uMD")
    const jettonWalletAddress = Address.parse("kQACrUSuQ0YnRL6pkdxl-m8akLJ9Cv9xMgpVYA5Yopw0Af7w");
    const jettonWallet = provider.open(JettonWallet.createFromAddress(jettonWalletAddress));
    await jettonWallet.sendTransfer(provider.sender(),
        toNano("0.1"),
        toNano("1000000000"),
        toAddress,
        responseAddress,
        beginCell().endCell(),
        toNano("0.05"),
        beginCell().endCell()
    )
    ui.write(`Token Transfer transaction sent to <https://testnet.tonscan.org/address/${toAddress}`)
}

