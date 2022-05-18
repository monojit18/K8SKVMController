/*jshint esversion: 8 */

const KVMController = require("./kvmController");
const KVMErrorModel = require("../models/kvmErrorModel");
const KVMKeyVaultModel = require("../models/kvmKeyVaultModel");

class KVMKeyVaultController extends KVMController
{
    
    constructor(applicationInfo)
    {

        super(applicationInfo);
        const _self = this;

        this.kvBaseURL = "/:kvName/secrets/:secretName";
        this.kvAllSecretsURL = "/:kvName/secrets";
        this.versionToken = "/versions";
        this.purgeToken = "/purge";

        _self.applicationInfo.routerInfo.get(`${_self.kvBaseURL}`,
        async (request, response) =>
        {
            
            const keyVaultParams = _self.prepareKeyVaultParams(request);

            const kvClient = _self.retrieveKeyVaultClientAsync
            (keyVaultParams.headers, keyVaultParams.keyVaultName);

            try
            {

                const res = await kvClient.getSecret(keyVaultParams.secretName);
                const secretValueInfo = new KVMKeyVaultModel(res);
                response.status(200);
                response.send(secretValueInfo);

            }
            catch(ex)
            {

                const errorInfo = new KVMErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode
                                                        : 500);
                response.send(errorInfo);

            }            
        });

        _self.applicationInfo.routerInfo.get(`${_self.kvBaseURL}${_self.versionToken}`,
        async (request, response) =>
        {
            
            const keyVaultParams = _self.prepareKeyVaultParams(request);
            const kvClient = _self.retrieveKeyVaultClientAsync
                             (keyVaultParams.headers, keyVaultParams.keyVaultName);
            
            const secretValueInfoList = [];
            const errorInfoList = [];            

            const iterator = kvClient.listPropertiesOfSecrets();
            let result = await iterator.next();
            do
            {

                try
                {

                    const secretName = result.value.name;

                    const version = result.value.version;
                    const versionInfo = {};
                    versionInfo.version = version;

                    const res = await kvClient.getSecret(secretName, versionInfo);
                    const secretValueInfo = new KVMKeyVaultModel(res);
                    secretValueInfoList.push(secretValueInfo);

                }
                catch(ex)
                {

                    const errorInfo = new KVMErrorModel(ex);
                    errorInfoList.push(errorInfo);

                }

                result = await iterator.next();
            } while (result.done != true);

            const allSecretsInfo = {};
            allSecretsInfo.secrets = secretValueInfoList;
            allSecretsInfo.errors = errorInfoList;
            
            response.status(200);
            response.send(allSecretsInfo);

        });

        _self.applicationInfo.routerInfo.get(`${_self.kvAllSecretsURL}`,
        async (request, response) =>
        {
            
            const keyVaultParams = _self.prepareKeyVaultParams(request);

            const kvClient = _self.retrieveKeyVaultClientAsync
                             (keyVaultParams.headers, keyVaultParams.keyVaultName);
            
            const secretValueInfoList = [];
            const errorInfoList = [];

            const iterator = kvClient.listPropertiesOfSecrets();
            let result = await iterator.next();
            do
            {

                try
                {

                    const secretName = result.value.name;
                    const res = await kvClient.getSecret(secretName);
                    const secretValueInfo = new KVMKeyVaultModel(res);
                    secretValueInfoList.push(secretValueInfo);

                }
                catch(ex)
                {

                    const errorInfo = new KVMErrorModel(ex);
                    errorInfoList.push(errorInfo);

                }

                result = await iterator.next();
            } while (result.done != true);

            const allSecretsInfo = {};
            allSecretsInfo.secrets = secretValueInfoList;
            allSecretsInfo.errors = errorInfoList;
            
            response.status(200);
            response.send(allSecretsInfo);

        });

        _self.applicationInfo.routerInfo.post(`${_self.kvBaseURL}`,
        async (request, response) =>
        {

            const keyVaultParams = _self.prepareKeyVaultParams(request);
            const kvClient = _self.retrieveKeyVaultClientAsync
                             (keyVaultParams.headers, keyVaultParams.keyVaultName);

            const secretBody = request.body;
            const valueb64 = Buffer.from(secretBody.value, "base64");
            const secretValue = valueb64.toString("utf8");
            
            try
            {

                const res = await kvClient.setSecret(keyVaultParams.secretName,
                                                     secretValue);
                const secretValueInfo = new KVMKeyVaultModel(res);
                response.status(200);
                response.send(secretValueInfo);

            }
            catch(ex)
            {

                const errorInfo = new KVMErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode
                                                        : 500);
                response.send(errorInfo);

            }            
        });

        _self.applicationInfo.routerInfo.delete(`${_self.kvBaseURL}`,
        async (request, response) =>
        {

            const keyVaultParams = _self.prepareKeyVaultParams(request);
            const kvClient = _self.retrieveKeyVaultClientAsync
                             (keyVaultParams.headers, keyVaultParams.keyVaultName);
            
            try
            {
                
                const res = await kvClient.deleteSecret(keyVaultParams.secretName);
                response.status(204);
                response.send({});

            }
            catch(ex)
            {

                const errorInfo = new KVMErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode : 500);
                response.send(errorInfo);

            }                    
        });

        _self.applicationInfo.routerInfo.delete(`${_self.kvAllSecretsURL}`,
        async (request, response) =>
        {
            
            const keyVaultParams = _self.prepareKeyVaultParams(request);

            const kvClient = _self.retrieveKeyVaultClientAsync
                             (keyVaultParams.headers, keyVaultParams.keyVaultName);
                        
            const errorInfoList = [];

            const iterator = kvClient.listPropertiesOfSecrets();
            let result = await iterator.next();
            do
            {

                try
                {

                    const secretName = result.value.name;
                    await kvClient.deleteSecret(secretName);                                       

                }
                catch(ex)
                {

                    const errorInfo = new KVMErrorModel(ex);
                    errorInfoList.push(errorInfo);

                }

                result = await iterator.next();
            } while (result.done != true);            
            
            if (errorInfoList.length > 0)
            {

                response.status(500);
                response.send(errorInfoList);
                return;

            }

            response.status(204);
            response.send({});
            
        });

        _self.applicationInfo.routerInfo.purge(`${_self.kvBaseURL}`,
        async (request, response) =>
        {
            
            const keyVaultParams = _self.prepareKeyVaultParams(request);
            const kvClient = _self.retrieveKeyVaultClientAsync
                             (keyVaultParams.headers, keyVaultParams.keyVaultName);

            try
            {

                const recoverPoller =
                await kvClient.beginRecoverDeletedSecret(keyVaultParams.secretName);

                await recoverPoller.pollUntilDone();
                await kvClient.purgeDeletedSecret(keyVaultParams.secretName);

                response.status(204);
                response.send({});

            }
            catch(ex)
            {

                const errorInfo = new KVMErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode : 500);
                response.send(errorInfo);

            }                        
        });

        _self.applicationInfo.routerInfo.purge(`${_self.kvAllSecretsURL}`,
        async (request, response) =>
        {
            
            const keyVaultParams = _self.prepareKeyVaultParams(request);
            const kvClient = _self.retrieveKeyVaultClientAsync
                             (keyVaultParams.headers, keyVaultParams.keyVaultName);

            const errorInfoList = [];

            const iterator = kvClient.listDeletedSecrets();
            let result = await iterator.next();
            do
            {

                try
                {

                    const secretName = result.value.name;
                    const recoverPoller =
                    await kvClient.beginRecoverDeletedSecret(secretName);

                    await recoverPoller.pollUntilDone();
                    await kvClient.purgeDeletedSecret(secretName);

                    response.status(204);
                    response.send({});

                }
                catch(ex)
                {

                    const errorInfo = new KVMErrorModel(ex);
                    errorInfoList.push(errorInfo);

                }

                result = await iterator.next();
            } while (result.done != true);            
            
            if (errorInfoList.length > 0)
            {

                response.status(500);
                response.send(errorInfoList);
                return;

            }

            response.status(204);
            response.send({});                                
                  
        });
    }
}

module.exports = KVMKeyVaultController;


