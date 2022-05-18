/*jshint esversion: 8 */

class KVMController
{
    
    constructor(applicationInfo)
    {

        const _self = this;
        this.applicationInfo = applicationInfo;
        this.routerInfo = applicationInfo.routerInfo;

    }

    prepareCredentials()
    {

        const headers = {};
        headers.client_id = process.env.client_id;
        headers.secret = process.env.secret;
        headers.tenant_id = process.env.tenant_id;

        return headers;

    }

    prepareKeyVaultParams(request)
    {
        
        const headers = this.prepareCredentials();
        const keyVaultName = request.params.kvName;
        const secretName = request.params.secretName;

        const keyvaultParams = {};
        keyvaultParams.headers = headers;
        keyvaultParams.keyVaultName = keyVaultName;
        keyvaultParams.secretName = secretName;

        return keyvaultParams;

    }

    retrieveKeyVaultClientAsync(requestHeaders, keyVaultName)
    {

        const credential = new this.applicationInfo.KeyVaultIdentity
                                   .ClientSecretCredential(
                                    requestHeaders.tenant_id,
                                    requestHeaders.client_id,
                                    requestHeaders.secret);

        const keyVaultURI = `https://${keyVaultName}.vault.azure.net/`;
        const kvClient = new this.applicationInfo.KeyVaultSecrets
                                 .SecretClient(keyVaultURI, credential);
        this.applicationInfo.kvClient = kvClient;        
        return kvClient;

    }
}

module.exports = KVMController;


