/*jshint esversion: 8 */

class KVMSecretModel
{

    constructor(secretInfo)
    {

        this.name = secretInfo.metadata.name;
        this.namespace = secretInfo.metadata.namespace;
        this.data =  secretInfo.data;
        
    }
}

module.exports = KVMSecretModel;