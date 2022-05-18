/*jshint esversion: 8 */

class KVMSecretModel
{

    constructor(secretValueInfo)
    {
        this.name = secretValueInfo.data.name;
        this.namespace = secretValueInfo.data.namespace;
        this.data = secretValueInfo.data.data;
    }

}

module.exports = KVMSecretModel;