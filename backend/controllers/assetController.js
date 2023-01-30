const AssetModel = require('../models/assetModel');

const axios = require('axios');
const algosdk = require('algosdk');



const uploadJson = async (name, description) => {
    console.log(name, description);
    BASE_JSON = {
        name: name,
        description: description,
        image:
            process.env.IMAGE_URL,
        attributes: [],
    };

    const data = JSON.stringify({
        pinataOptions: {
            cidVersion: 1,
        },
        pinataMetadata: {
            name: `${name}`,
            keyvalues: {
                customKey: 'customValue',
                customKey2: 'customValue2',
            },
        },
        pinataContent: BASE_JSON,
    });

    const config = {
        method: 'post',
        url: process.env.PINATA_URL,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.PINATA_TOKEN}`,
        },
        data: data,
    };

    const res = await axios(config);
    return res.data.IpfsHash;
};


const waitForConfirmation = async function (algodClient, txId) {
    let lastround = (await algodClient.status().do())['last-round'];
    while (true) {
        const pendingInfo = await algodClient
            .pendingTransactionInformation(txId)
            .do();
        if (
            pendingInfo['confirmed-round'] !== null &&
            pendingInfo['confirmed-round'] > 0
        ) {
            //Got the completed Transaction
            console.log(
                'Transaction confirmed in round ' + pendingInfo['confirmed-round']
            );
            break;
        }
        lastround++;
        await algodClient.statusAfterBlock(lastround).do();
    }
};

exports.createAsset = async (req, res, next) => {
    try {
        // upload asset to IPFS
        const ipfsHash = await uploadJson(
            req.body.name,
            `${req.body.name}'s asset`
        );
        sk = algosdk.mnemonicToSecretKey(process.env.MNEMO1);

        const upfsUrl = 'https://ipfs.io/ipfs/' + ipfsHash;

        algod_token = process.env.ALGOD_TOKEN;
        algod_address = process.env.ALGOD_ADDRESS;
        console.log(algod_token, algod_address);
        const pub_1 = process.env.PUBLIC_KEY1;
        const token = {
            'X-API-Key': process.env.A_KEY,
        };
        // let algodclient = new algosdk.Algod(algod_token, algod_address);
        let algodclient = new algosdk.Algodv2(token, algod_address, '');

        let params = await algodclient.getTransactionParams().do();

        let note = undefined;
        let addr = pub_1;
        // Whether user accounts will need to be unfrozen before transacting
        let defaultFrozen = false;
        // integer number of decimals for asset unit calculation
        let decimals = 0;
        // total number of this asset available for circulation
        let totalIssuance = 1;
        // Used to display asset units to user
        let unitName = 'Tenx NFT';
        // Friendly name of the asset
        let assetName = 'AlgoNFT';
        if (req.body.name.length > 6) {
            assetName =
                req.body.name[0] +
                req.body.name[1] +
                req.body.name[2] +
                req.body.name[3] +
                '...';
        } else {
            assetName = `${req.body.name}'s Asset`;
        }
        // let assetName = `${req.body.name}'s Asset`;
        // Optional string pointing to a URL relating to the asset
        let assetURL = upfsUrl;
        // Optional hash commitment of some sort relating to the asset. 32 character length.
        let assetMetadataHash = '16efaa3924a6fd9d3a4824799a4ac65d';
        let manager = pub_1;
        let reserve = pub_1;
        // Specified address can freeze or unfreeze user asset holdings
        let freeze = pub_1;
        // Specified address can revoke user asset holdings and send
        // them to other addresses
        let clawback = pub_1;

        // signing and sending "txn" allows "addr" to create an asset
        // makeAssetCreateTxnWithSuggestedParamsFromObject;
        let txn = algosdk.makeAssetCreateTxnWithSuggestedParams(
            addr,
            note,
            totalIssuance,
            decimals,
            defaultFrozen,
            manager,
            reserve,
            freeze,
            clawback,
            unitName,
            assetName,
            assetURL,
            assetMetadataHash,
            params
        );

        let signedTxn = algosdk.signTransaction(txn, sk.sk);
        const sendTx = await algodclient.sendRawTransaction(signedTxn.blob).do();
        console.log('Transaction sent with ID ' + sendTx.txId);
        // const ptx = await waitForConfirmation(algodclient, sendTx.txId);
        const ptx = await algosdk.waitForConfirmation(algodclient, sendTx.txId, 4);
        const assetID = ptx['asset-index'];
        console.log('THE ASSET ID IS: ', assetID);

        res.status(201).json({
            status: 'Asset created successfully!',
            assetID,
        });
    } catch (err) {
        console.log('SOME ERROR HAS OCCURED: ', err);
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.transferAsset = async (req, res, next) => {
    const algod_token = process.env.ALGOD_TOKEN;
    const algod_address = process.env.ALGOD_ADDRESS;
    // const pub_1 = req.body.address;
    const token = {
        'X-API-Key': process.env.A_KEY,
    };
    // let algodclient = new algosdk.Algod(algod_token, algod_address);
    let algodclient = new algosdk.Algodv2(token, algod_address, '');

    // const ptx = await waitForConfirmation(algodclient, sendTx.txId);
    const ptx = await algosdk.waitForConfirmation(algodclient, req.body.txId, 4);
    const assetID = ptx['asset-index'];
    console.log('THE ASSET ID IS: ', assetID);
    // Update the traineeModel by ID and change Mint field to Minted

    res.status(200).json({
        status: 'Successfully transeferred asset!',
        assetID,
    });
};

exports.transferAsset = async (req, res, next) => {
    try {
        sk = algosdk.mnemonicToSecretKey(process.env.MNEMO1);

        algod_token = process.env.ALGOD_TOKEN;
        algod_address = process.env.ALGOD_ADDRESS;
        console.log(algod_token, algod_address);
        const pub_1 = process.env.PUBLIC_KEY1;
        const pub_2 = req.body.address;
        const token = {
            'X-API-Key': process.env.A_KEY,
        };
        // let algodclient = new algosdk.Algod(algod_token, algod_address);
        let algodclient = new algosdk.Algodv2(token, algod_address, '');
        params = await algodclient.getTransactionParams().do();

        sender = pub_1;
        recipient = pub_2;
        revocationTarget = undefined;
        closeRemainderTo = undefined;
        note = undefined;
        assetID = req.body.asset_id;
        //Amount of the asset to transfer
        amount = 1;

        // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
        let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
            sender,
            recipient,
            closeRemainderTo,
            revocationTarget,
            amount,
            note,
            assetID,
            params
        );
        // Must be signed by the account sending the asset
        rawSignedTxn = xtxn.signTxn(sk.sk);
        let xtx = await algodclient.sendRawTransaction(rawSignedTxn).do();

        // Wait for confirmation
        confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);
        //Get the completed Transaction
        console.log(
            'Transaction ' +
            xtx.txId +
            ' confirmed in round ' +
            confirmedTxn['confirmed-round']
        );

        // You should now see the 1 assets listed in the account information
        console.log('Successfuly transferred asset');
        const assetUrl =
            'https://goalseeker.purestake.io/algorand/testnet/asset/' +
            req.body.asset_id;

        res.status(200).json({
            status: 'success',
            message: 'Asset transferred successfully',
        });
    } catch (err) {
        console.log('SOME ERROR HAS OCCURED: ', err);
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};



exports.optinAsset = async (req, res, next) => {
    try {
        sk = algosdk.mnemonicToSecretKey(process.env.MNEMO1);

        algod_token = process.env.ALGOD_TOKEN;
        algod_address = process.env.ALGOD_ADDRESS;
        console.log(algod_token, algod_address);
        const pub_1 = process.env.PUBLIC_KEY1;
        const pub_2 = req.body.address;
        const token = {
            'X-API-Key': process.env.A_KEY,
        };
        // let algodclient = new algosdk.Algod(algod_token, algod_address);
        let algodclient = new algosdk.Algodv2(token, algod_address, '');

        params = await algodclient.getTransactionParams().do();

        let sender = pub_2;
        let recipient = sender;

        let revocationTarget = undefined;
        // CloseReaminerTo is set to undefined as
        // we are not closing out an asset
        let closeRemainderTo = undefined;
        // We are sending 0 assets
        amount = 0;
        note = undefined;
        assetID = req.body.asset_id;
        // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
        let opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
            sender,
            recipient,
            closeRemainderTo,
            revocationTarget,
            amount,
            note,
            assetID,
            params
        );

        // Must be signed by the account wishing to opt in to the asset
        rawSignedTxn = opttxn.signTxn(sk.sk);
        let opttx = await algodclient.sendRawTransaction(rawSignedTxn).do();
        // Wait for confirmation
        confirmedTxn = await algosdk.waitForConfirmation(
            algodclient,
            opttx.txId,
            4
        );
        //Get the completed Transaction
        console.log(
            'Transaction ' +
            opttx.txId +
            ' confirmed in round ' +
            confirmedTxn['confirmed-round']
        );
        console.log('Sucessfully optedin');
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.createAccount = async (req, res, next) => {
    try {
        algodToken = process.env.ALGOD_TOKEN;
        algodServer = process.env.ALGOD_ADDRESS;
        // let algodClient = new algosdk.Algod(algod_token, algod_address);

        let algodClient = new algosdk.Algodv2(algodToken, algodServer);

        let params = await algodClient.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        params.fee = 1000;
        params.flatFee = true;
        const receiver =
            'GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A';
        const enc = new TextEncoder();
        let note = enc.encode('Hello World');
        let txn = algosdk.makePaymentTxnWithSuggestedParams(
            myAccount.addr,
            receiver,
            1000000,
            undefined,
            note,
            params
        );

        const account = await algosdk.generateAccount();
        res.status(201).json({
            status: 'success',
            data: {
                account,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};