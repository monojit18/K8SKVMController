/*jshint esversion: 8 */

const KVMSecretModel = require("../models/kvmSecretModel");

class KVMSecretModelsList
{

    constructor(secretInfo)
    {

        const secretInfoList = [];
        if (secretInfo.items == null)
            return secretInfoList;

        secretInfo.items.forEach((secretInfo) =>
        {

            const secretInfoItem = new KVMSecretModel(secretInfo);
            secretInfoList.push(secretInfoItem);

        });

        return secretInfoList;

    }
}

module.exports = KVMSecretModelsList;