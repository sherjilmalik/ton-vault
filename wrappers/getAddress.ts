// Chapter 7.5: 4th slide solution

// First:

import { TonClient } from 'ton';
import { Address } from '@ton/core';
import { TupleBuilder } from '@ton/core';

export const toncenter = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
});

export const nftCollectionAddress = Address.parse('EQAv9X13hopdcDCO3azadyHy3mqIjzPgr0_fdrUdXjtpZjqP');


// get NFT address by index

(async () => {
    let args = new TupleBuilder();
    args.writeNumber(2);

    let { stack } = await toncenter.callGetMethod(
        nftCollectionAddress, 
        'get_nft_address_by_index',
        args.build(),
    );
    let nftAddress = stack.readAddress();

    console.log('nftAddress', nftAddress.toString());
})().catch(e => console.error(e));


// Second:

export const nftAddress = Address.parse('EQCv2VDHfXId4XSEU71zGSMF4zLRuss1eOKEiKn9GYJz2K7s');

(async () => {
    let { stack } = await toncenter.callGetMethod(
        nftAddress, 
        'get_nft_data'
    );
    let initFlag = stack.readBigNumber();
    let indexItem = stack.readBigNumber();
    let collectionAddr = stack.readAddress();
    let ownerAddr = stack.readAddress();

    console.log('owner', ownerAddr);
})().catch(e => console.error(e));