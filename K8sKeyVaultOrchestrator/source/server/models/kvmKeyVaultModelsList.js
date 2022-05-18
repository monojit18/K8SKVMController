/*jshint esversion: 8 */

class KVMKeyVaultModelsList
{

    constructor(keyVaultInfo)
    {

        this.errors = [];
        this.secrets = [];

        const keyVaultInfoData = keyVaultInfo.data;

        if (keyVaultInfoData.errors.length > 0)
            this.errors = keyVaultInfo.data.errors;
        else
        {

            const secretsList = keyVaultInfoData.secrets;            
            secretsList.forEach((keyVaultInfo) =>
            {

                this.secrets.push(keyVaultInfo);

            });
        }
    }
}

module.exports = KVMKeyVaultModelsList;