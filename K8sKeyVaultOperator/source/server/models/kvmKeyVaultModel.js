/*jshint esversion: 8 */

class KVMKeyVaultModel
{

    constructor(secretValueInfo)
    {

        let valueb64 = Buffer.from(secretValueInfo.value, "utf8");
        this.value = valueb64.toString("base64");

        this.name = secretValueInfo.name;
        this.version = secretValueInfo.properties.version;
    }

}

module.exports = KVMKeyVaultModel;