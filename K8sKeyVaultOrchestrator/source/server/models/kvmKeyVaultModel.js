/*jshint esversion: 8 */

class KVMKeyVaultModel
{

    constructor(secretValueInfo)
    {
        this.name = secretValueInfo.data.name;
        this.value = secretValueInfo.data.value;
        this.version = secretValueInfo.data.version;
    }

}

module.exports = KVMKeyVaultModel;