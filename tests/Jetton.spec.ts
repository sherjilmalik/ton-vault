import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Cell, TupleItemInt } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { NFTItem } from '../wrappers/NftItem';

describe('NFTCollection and NFTItem Tests', () => {
    let collectionCode: Cell;
    let nftItemCode: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let newOwner: SandboxContract<TreasuryContract>;
    let nftCollection: SandboxContract<NftCollection>;
    let defaultContent: Cell;
    let nftItem: SandboxContract<NFTItem>

    beforeAll(async () => {
        collectionCode = await compile('NFTCollection');
        nftItemCode = await compile('NFTItem');
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        newOwner = await blockchain.treasury('newOwner');
        defaultContent = beginCell().storeStringTail('https://example.com/nft-metadata.json').endCell();

        nftCollection = blockchain.openContract(
            NftCollection.createFromConfig(
                {
                    ownerAddress: deployer.address,
                    nextItemIndex: 0,
                    collectionContent: defaultContent,
                    nftItemCode: nftItemCode,
                    royaltyParams: {
                        royaltyFactor: Math.floor(Math.random() * 500), 
                        royaltyBase: 1000,
                        royaltyAddress: deployer.address
                    }
                },
                collectionCode
            )
        );
    });

    // Test deployment of NFTCollection
    it('should deploy the NFT collection', async () => {
        const deployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano('1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
        });
    });

    // Test deploying a single NFT
    it('should deploy a single NFT from the collection', async () => {
        const randomSeed= Math.floor(Math.random() * 10000);
        const nftContent = beginCell().storeStringTail('https://example.com/nft1-metadata.json').endCell();
        const deployNFTResult = await nftCollection.sendMintNft(
            deployer.getSender(),
            {
                value: toNano("1.2"),
                queryId: randomSeed,
                amount: toNano("1"),
                itemIndex: 0,
                itemOwnerAddress: deployer.address,
                itemContent: nftContent
            }
        );

        expect(deployNFTResult.transactions).toHaveTransaction({
            from: nftCollection.address,
            success: true,
        });

        const index: TupleItemInt = { type: "int", value: BigInt(0)};
        // Check the deployed NFT address
        const nftAddress = await nftCollection.getItemAddressByIndex(index);
        expect(nftAddress).not.toBeNull();

        nftItem = blockchain.openContract(
            NFTItem.createFromAddress(nftAddress)
        );

        const nftData = await nftItem.getNftData();
        console.log(nftData)
    });

    it("should fail when more than 2500 nfts are minted", async () => {
        const randomSeed= Math.floor(Math.random() * 10000);
        const nftContent = beginCell().storeStringTail('https://example.com/nft1-metadata.json').endCell();
        for(let i = 1; i<2501; i++){
            const deployNFTResult = await nftCollection.sendMintNft(
                deployer.getSender(),
                {
                    value: toNano("1.2"),
                    queryId: randomSeed,
                    amount: toNano("1"),
                    itemIndex: i,
                    itemOwnerAddress: deployer.address,
                    itemContent: nftContent
                }
            );
            
            if(i < 2500){
                expect(deployNFTResult.transactions).toHaveTransaction({
                    from: deployer.address,
                    to: nftCollection.address,
                    success: true
                })
            }

            if (i == 2500){
                expect(deployNFTResult.transactions).toHaveTransaction({
                    from: deployer.address,
                    to: nftCollection.address,
                    success: false
                })
            }
        }

    });

    // Test changing the owner of the collection
    it('should change the collection owner', async () => {
        const randomSeed= Math.floor(Math.random() * 10000);
        const changeOwnerResult = await nftCollection.sendChangeOwner(deployer.getSender(), 
        {
            value: toNano("0.05"),
            queryId: randomSeed,
            newOwnerAddress: newOwner.address
        });
        expect(changeOwnerResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            success: true,
        });

        // Verify that the owner was changed
        const collectionData = await nftCollection.getCollectionData();
        expect(collectionData.ownerAddress).toEqualAddress(newOwner.address);
    });

    it("should not change the item owner when tried by someone other than the original owner", async () => {
        const randomSeed = Math.floor(Math.random() * 10000);

        const changeOwnerResult = await nftItem.sendTransferOwnership(newOwner.getSender(),
        {
            value: toNano("0.05"),
            queryId: randomSeed,
            itemIndex: 0,
            newOwnerAddress: newOwner.address,
            responseDestination: newOwner.address,
            forwardAmount: toNano("0.04")
        });
        expect(changeOwnerResult.transactions).toHaveTransaction({
            from: newOwner.address,
            to: nftItem.address,
            success: false
        })

    })

    it('should change the item owner', async () => {
        const randomSeed= Math.floor(Math.random() * 10000);

        const changeOwnerResult = await nftItem.sendTransferOwnership(deployer.getSender(), 
        {
            value: toNano("0.05"),
            queryId: randomSeed,
            itemIndex: 0,
            newOwnerAddress: newOwner.address,
            responseDestination: newOwner.address,
            forwardAmount: toNano('0.04')
        });
        expect(changeOwnerResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftItem.address,
            success: true
        });
    });

    it("should add like when liked by any user", async () => {
        const randomSeed= Math.floor(Math.random() * 10000);

        const likeNftResult = await nftItem.sendLike(newOwner.getSender(),
        {   
            value: toNano("0.05"),
            queryId: randomSeed
        });

        expect(likeNftResult.transactions).toHaveTransaction({
            from: newOwner.address,
            to: nftItem.address,
            success: true
        })

        const nftData = await nftItem.getNftData();
        console.log(nftData)
    });

    it("should not add like when liked by the same user again", async () => {
        const randomSeed = Math.floor(Math.random() * 10000);

        const likeNftResult = await nftItem.sendLike(newOwner.getSender(),
        {   
            value: toNano("0.05"),
            queryId: randomSeed
        });

        expect(likeNftResult.transactions).toHaveTransaction({
            from: newOwner.address,
            to: nftItem.address,
            success: false
        })

        const nftData = await nftItem.getNftData();
        console.log(nftData)
    });

    it("successfully deposits funds", async () => {
        const randomSeed = Math.floor(Math.random() * 10000);

        const depositMessageResult = await nftItem.sendDeposit(
          newOwner.getSender(),
        {
            value: toNano("5"),
            queryId: randomSeed
        });
    
        expect(depositMessageResult.transactions).toHaveTransaction({
          from: newOwner.address,
          to: nftItem.address,
          success: true,
        });

        const balance = await nftItem.getBalance();
        console.log(balance);
    });

    it("successfully withdraws funds", async () => {
        const randomSeed = Math.floor(Math.random() * 10000);

        const withdrawalMessageResult = await nftItem.sendWithdraw(
          newOwner.getSender(),
        {
            value: toNano("0.03"),
            queryId: randomSeed,
            amount: toNano("4")
        });
    
        expect(withdrawalMessageResult.transactions).toHaveTransaction({
          from: nftItem.address,
          to: newOwner.address,
          success: true,
        });

        const balance = await nftItem.getBalance();
        console.log(balance);
    });
});


//  console.log
// { number: 5092852412 }

// at Object.<anonymous> (tests/Nft.spec.ts:238:17)

// console.log
// { number: 1140734012 }