/*jshint esversion: 8 */

const KVMController = require("./kvmController");
const KVMKeyVaultErrorModel = require("../models/kvmKeyVaultErrorModel");
const KVMErrorModel = require("../models/kvmErrorModel");
const KVMDeleteModel = require("../models/kvmDeleteModel");
const KVMKeyVaultModel = require("../models/kvmKeyVaultModel");
const KVMKeyVaultModelsList = require("../models/kvmKeyVaultModelsList");
const KVMSecretModel = require("../models/kvmSecretModel");
const KVMDeployModel = require("../models/kvmDeployModel");
const KVMDeployErrorModel = require("../models/kvmDeployErrorModel");
const KVMCrdModel = require("../models/KVMCrdModel");

class KVMKeyVaultController extends KVMController
{
    
    constructor(applicationInfo)
    {

        super(applicationInfo);
        const _self = this;

        this.operatorBaseURL = "http://localhost:7080";
        this.baseURL = "http://localhost:7081";
        this.commonURL = "/:kvName/secrets/:secretName";
        this.namespaceURL = "/namespaces/:namespaceName";
        this.deployURL = "/:kvName/secrets/deploy/:deployName";
        this.allSecretsURL = "/:kvName/secrets/namespaces/:namespaceName";        
        this.webhookURL = "/:kvName/namespaces/:namespaceName/webhook/register";
        this.secretsToken = "/secrets";
        this.keyVaultsToken = "/keyvaults";
        this.validationURL = "/orchestrator/validate/";
        this.crdModel = null;

        const prepareKVWebhookResponse = (request) =>
        {

            const validationInfo = request.body[0].data;

            const validationResponse = {};
            validationResponse.validationResponse = validationInfo.validationCode;
            return validationResponse;
            
        };

        const prepareK8sValidationResponse = (validationBody, validationRequest) =>
        {
            
            let validationResponse = {};
            validationResponse.apiVersion = validationBody.apiVersion;
            validationResponse.kind = validationBody.kind;
            
            validationResponse.response = {};
            validationResponse.response.uid = validationRequest.uid;
            validationResponse.response.allowed = (requiredFieldsExists === true);
            
            validationResponse.response.status = {};
            validationResponse.response.status.code = 200;
            validationResponse.response.status.message = "Validated";
            return validationResponse;

        };

        const prepareHeaders = () =>
        {
            
            const headers = {};
            headers.client_id = process.env.client_id;
            headers.secret = process.env.secret;
            headers.tenant_id = process.env.tenant_id;
            return headers;

        };

        const prepareRequestParams = (request, urlToken) =>
        {

            const requestParams = {};

            const namespaceName = request.params.namespaceName;
            requestParams.namespaceName = namespaceName;

            const kvName = request.params.kvName;
            requestParams.kvName = kvName;

            const secretName = request.params.secretName;
            requestParams.secretName = secretName;

            const deployName = request.params.deployName;
            requestParams.deployName = deployName;

            const k8sSecretName = request.body.k8sSecret;
            requestParams.k8sSecretName = k8sSecretName;

            const config = {};
            if (urlToken != null)
            {
                
                config.baseURL = `${_self.operatorBaseURL}${urlToken}`;
                config.headers = prepareHeaders();

            }

            requestParams.config = config;
            return requestParams;

        };

        const prepareSecretBody = (keyVaultInfoList, secretValueInfo) =>
        {

            if (keyVaultInfoList == null)
                return null;

            const allSecrets = [];

            if (secretValueInfo != null)
            {

                const keys = Object.keys(secretValueInfo.data);
                keys.forEach((keyInfo) =>
                {

                    const data = {};
                    data.key = `${keyInfo}`;
                    data.value = secretValueInfo.data[`${keyInfo}`];                
                    allSecrets.push(data);

                });

            }
            
            keyVaultInfoList.forEach((keyVaultInfo) =>
            {

                const data = {};
                data.key = keyVaultInfo.mappedName;
                data.value = keyVaultInfo.value;
                allSecrets.push(data);

            });
            
            return allSecrets;

        };

        const prepareEnvVarValue = (envVarBase64Value) =>
        {
            
            const valueb64 = Buffer.from(envVarBase64Value, "base64");
            const decodedEnvVarValue = valueb64.toString("utf8");
            return decodedEnvVarValue;

        };

        const prepareEnvVars = (deployInfo, keyVaultInfoList) =>
        {
    
            let envVarsInfoList = deployInfo.spec.template.spec.containers[0].env;
            if (envVarsInfoList == null)
                envVarsInfoList = [];
            
            keyVaultInfoList.forEach((keyVaultInfo) =>
            {

                const decodedEnvVarValue = prepareEnvVarValue(keyVaultInfo.value);                
                let envVarInfo = {};

                const selectedEnvVarInfo = envVarsInfoList.find((envVarInfo) =>
                {

                    return (envVarInfo.name === keyVaultInfo.mappedName);

                });

                if (selectedEnvVarInfo != null)
                {

                    envVarInfo = selectedEnvVarInfo;
                    envVarInfo.value = decodedEnvVarValue;
                
                }
                else
                {

                    envVarInfo.name = keyVaultInfo.mappedName;
                    envVarInfo.value = decodedEnvVarValue;
                    envVarsInfoList.push(envVarInfo);

                }                
            });

            deployInfo.spec.template.spec.containers[0].env = envVarsInfoList;

        };

        const prepareEnVFromVars = (deployInfo, secretName) =>
        {
    
            let envVarsFromInfoList = deployInfo.spec.template.spec.containers[0].envFrom;
            if (envVarsFromInfoList == null)
                envVarsFromInfoList = [];
            
            const selectedEnvVarsInfo = envVarsFromInfoList.find((envVarsFromInfo) =>
            {

                return (envVarsFromInfo.secretRef.name === secretName);

            });
            
            if (selectedEnvVarsInfo != null)
                return;
                        
            const envFromInfo = {};
            const secretRef = {};
            secretRef.name = secretName;
            envFromInfo.secretRef = secretRef;

            envVarsFromInfoList.push(envFromInfo);
            deployInfo.spec.template.spec.containers[0].envFrom = envVarsFromInfoList;

                        
        };
        
        const processKVWebhookResponse = async (request, webhookConfig) =>
        {

            const id = request.body[0].data.Id;
            const vaultName = request.body[0].data.VaultName;
            const objectType = request.body[0].data.ObjectType;
            const objectName = request.body[0].data.ObjectName;
            const version = request.body[0].data.Version;
            const secretName = objectName;
            
            const kvName = webhookConfig.kvName;            
            const namespaceName = webhookConfig.namespaceName;
            const k8sSecretName = webhookConfig.k8sSecretName;
            const headers = webhookConfig.headers;

            if (kvName != vaultName)
                return;            

            if (objectType != "Secret")
                return; 
                
            const config = {};
            config.baseURL = `${_self.baseURL}${_self.keyVaultsToken}`;
            config.headers = headers;

            const body = {};
            body.k8sSecret = k8sSecretName;
            body.kvSecrets = [secretName];

            try
            {

                const res = await _self.applicationInfo.Axios.post
                              (`/${kvName}/secrets/namespaces/${namespaceName}`,
                                body, config);
                return res;

            }
            catch(ex)
            {

                throw ex;

            }
        };

        const processK8sValidationResponse = (request) =>
        {

            const validationBody = request.body;            
            const validationRequest = request.body.request;            
            console.log(JSON.stringify(validationRequest.object.spec));

            _self.crdModel = new KVMCrdModel(validationRequest.object.spec);            

            const validationResponse = prepareK8sValidationResponse
                                       (validationBody, validationRequest);

            return validationResponse;

        };

        const filterKeyVaultSecrets = (request, keyVaultInfoList) =>
        {

            const kvSecretNamesList = request.body.kvSecrets;
            const filteredKeyVaultInfoList = keyVaultInfoList.filter((keyVaultInfo) =>
            {

                const selectedKVSecretInfo = kvSecretNamesList.find((kvSecretInfo) =>
                {

                    return (kvSecretInfo.kvSecret === keyVaultInfo.name);

                });
            
                if (selectedKVSecretInfo != null)
                    keyVaultInfo.mappedName = selectedKVSecretInfo.envSecret;
                
                return (selectedKVSecretInfo != null);

            });

            return filteredKeyVaultInfoList;

        };  

        const processKeyVaultSecretAsync = async (request, keyVaultInfoList) =>
        {

            try
            {

                let secretValueInfo = await getSecretAsync(request);
                secretValueInfo = await patchSecretAsync(request, secretValueInfo,
                                                         keyVaultInfoList);
                return secretValueInfo;

            }
            catch(errorInfo)
            {

                if (errorInfo.status != 404)
                    throw errorInfo;
                
                try
                {

                    const secretValueInfo = await saveAsSecretAsync(request, keyVaultInfoList);
                    return secretValueInfo;

                }
                catch(errorInfo)
                {

                    throw errorInfo;

                }            
            }

        };

        const processKeyVaultSecretsForDeployAsync = async (request, keyVaultInfoList) =>
        {

            try
            {

                const requestParams = prepareRequestParams(request, null);

                let res = await _self.applicationInfo.k8sAppsV1Api.readNamespacedDeployment
                (requestParams.deployName, requestParams.namespaceName);

                let deployInfo = res.body;
                const secretName = requestParams.k8sSecretName;
                if (secretName != null)
                    prepareEnVFromVars(deployInfo, secretName);
                else
                    prepareEnvVars(deployInfo, keyVaultInfoList);                

                try
                {

                    const options = {};
                    options.headers =
                    {
                        
                        "Content-Type": "application/merge-patch+json"

                    };

                    const res = _self.applicationInfo.k8sAppsV1Api.patchNamespacedDeployment
                    (requestParams.deployName, requestParams.namespaceName, deployInfo,
                     undefined, undefined, undefined, undefined, options);
                
                    deployInfo = new KVMDeployModel(res.body);
                    return deployInfo;

                }
                catch(ex)
                {

                    const errorInfo = new KVMDeployErrorModel(ex);
                    throw errorInfo;               

                }            
            }
            catch(ex)
            {

                const errorInfo = new KVMKeyVaultErrorModel(ex);
                throw errorInfo;            

            }
        };

        const fetchCRDInfoAsync = async () =>
        {

            const config = {};
            config.baseURL = `${_self.applicationInfo.clusterInfo.selectedCluster.server}`;
            config.httpsAgent = _self.applicationInfo.clusterInfo.httpsAgent;

            const headers = {};
            headers.Authorization = `Bearer ${_self.applicationInfo.clusterInfo.selectedUser.token}`;
            config.headers = headers;

            const crdURL = "/apis/kvm.api.server/v1/kvmorchestrators";

            const res = await _self.applicationInfo.Axios.get(`${crdURL}`, config);
            const validationModel = res.data.items[0].spec;
            _self.crdModel = new KVMCrdModel(validationModel);

        };

        const prepareSecretsFromCRDAsync = async () =>
        {
        
            const deploymentsList = _self.crdModel.deployments;
            const keyvaultName = _self.crdModel.kvName;
            const secretNamespace = _self.crdModel.namespace;

            deploymentsList.forEach((deploymentInfo) =>
            {

                const secretsList = deploymentInfo.secrets;
                secretsList.forEach(async (secretInfo) =>
                {
                
                    try
                    {

                        let secretValueInfo = await invokeAddAllSecretsAsync
                                                      (secretInfo.secretName,
                                                       secretInfo.kvSecrets,
                                                       keyvaultName, secretNamespace);
                        console.log(secretValueInfo);

                        secretValueInfo = await invokeAddAllEnvVarsAsync
                                                (secretInfo.secretName,
                                                secretInfo.kvSecrets,
                                                deploymentInfo.name, keyvaultName,
                                                secretNamespace);
                        console.log(secretValueInfo);
                    
                    }
                    catch(ex)
                    {
                    
                        console.log(ex);

                    }
                });
            });

        };

        const fetchSecretsFromKeyVaultAsync = async (request) =>
        {

            try           
            {

                const requestParams = prepareRequestParams(request, _self.keyVaultsToken);

                const res = await _self.applicationInfo.Axios.get
                (`/${requestParams.kvName}/secrets`, requestParams.config);
                
                const keyVaultInfoList = new KVMKeyVaultModelsList(res);
                if (keyVaultInfoList.errors.length > 0)
                    throw keyVaultInfoList.errors;
                
                return keyVaultInfoList.secrets;

            }
            catch(ex)
            {
                
                const errorInfo = new KVMKeyVaultErrorModel(ex);
                throw errorInfo;
                
            }
        };

        const getSecretAsync = async (request) =>
        {
            
            try
            {
                
                const requestParams = prepareRequestParams(request, _self.secretsToken);

                const res = await _self.applicationInfo.Axios.get
                                 (`/${requestParams.k8sSecretName}/namespaces/${requestParams.namespaceName}`,
                                  requestParams.config);
                const secretValueInfo = new KVMSecretModel(res);
                return secretValueInfo;

            }
            catch(ex)
            {
                
                const errorInfo = new KVMErrorModel(ex);
                throw errorInfo;

            }
        };

        const saveAsSecretAsync = async (request, keyVaultInfoList) =>
        {

            try
            {

                const requestParams = prepareRequestParams(request, _self.secretsToken);
                const allSecretsList = prepareSecretBody(keyVaultInfoList, null);

                const res = await _self.applicationInfo.Axios.put
                                  (`/${requestParams.k8sSecretName}/namespaces/${requestParams.namespaceName}`,
                                   allSecretsList, requestParams.config);
                                
                const secretValueInfo = new KVMSecretModel(res);
                return secretValueInfo;

            }
            catch(ex)
            {
                
                const errorInfo = new KVMErrorModel(ex);
                throw errorInfo;

            }
        };

        const patchSecretAsync = async (request, secretValueInfo, keyVaultInfoList) =>
        {
            
            try
            {

                const requestParams = prepareRequestParams(request, _self.secretsToken);
                const allSecretsList = prepareSecretBody(keyVaultInfoList, secretValueInfo);

                const res = await _self.applicationInfo.Axios.patch
                            (`/${requestParams.k8sSecretName}/namespaces/${requestParams.namespaceName}`,
                                allSecretsList, requestParams.config);
                
                secretValueInfo = new KVMSecretModel(res);
                return secretValueInfo;

            }
            catch(ex)
            {
                
                const errorInfo = new KVMErrorModel(ex);
                throw errorInfo;

            }
        };

        const invokeAddAllSecretsAsync = async (k8sSecretName, kvSecretsList,
                                                keyvaultName, secretNamespace) =>
        {
        
            const config = {};
            config.baseURL = `${_self.baseURL}${_self.keyVaultsToken}`;

            const body = {};
            body.k8sSecret = k8sSecretName;
            body.kvSecrets = kvSecretsList;

            try
            {

                const secretValueInfo = await _self.applicationInfo.Axios
                                                   .post(`/${keyvaultName}/secrets/namespaces/${secretNamespace}`,
                                                         config);
                return secretValueInfo;
            
            }
            catch(ex)
            {
            
                throw ex;

            }
        };

        const invokeAddAllEnvVarsAsync = async (k8sSecretName, kvSecretsList,
                                                deploymentName, keyvaultName,
                                                secretNamespace) =>
        {
        
            const config = {};
            config.baseURL = `${_self.baseURL}${_self.keyVaultsToken}`;
            const requestURL = `${keyvaultName}/secrets/deploy/${deploymentName}/namespaces/${secretNamespace}`;

            const body = {};
            if (k8sSecretName != null)
                body.k8sSecret = k8sSecretName;
            
            body.kvSecrets = kvSecretsList;

            try
            {

                const secretValueInfo = await _self.applicationInfo.Axios
                                                   .post(`${requestURL}`, config);
                return secretValueInfo;
            
            }
            catch(ex)
            {
            
                throw ex;

            }
        };

        _self.applicationInfo.routerInfo.post(`${_self.allSecretsURL}`,
        async (request, response) =>
        {
            
            try
            {

                const keyVaultInfoList = await fetchSecretsFromKeyVaultAsync(request);
                const filteredKeyVaultInfoList = filterKeyVaultSecrets(request, keyVaultInfoList);

                if (filteredKeyVaultInfoList.length <= 0)
                {

                    response.status(500);
                    response.send({});
                    return;

                }

                const secretValueInfo = await processKeyVaultSecretAsync
                (request, filteredKeyVaultInfoList);
                
                response.status(200);
                response.send(secretValueInfo);

            }
            catch(ex)
            {

                response.status(500);
                response.send(ex);

            }            
        });

        _self.applicationInfo.routerInfo.post(`${_self.deployURL}${_self.namespaceURL}`,
        async (request, response) =>
        {
            
            try
            {

                const keyVaultInfoList = await fetchSecretsFromKeyVaultAsync(request);
                const filteredKeyVaultInfoList = filterKeyVaultSecrets(request, keyVaultInfoList);

                if (filteredKeyVaultInfoList.length <= 0)
                {

                    response.status(500);
                    response.send({});
                    return;

                }

                const secretValueInfo = await processKeyVaultSecretsForDeployAsync
                                              (request, filteredKeyVaultInfoList);                
                response.status(200);
                response.send(secretValueInfo);

            }
            catch(ex)
            {

                response.status(500);
                response.send(ex);

            }
        });

        _self.applicationInfo.routerInfo.post(`${_self.webhookURL}`,
        (request, response) =>
        {

            const requestParams = prepareRequestParams(request, _self.keyVaultsToken);

            _self.applicationInfo.routerInfo.post(`/${requestParams.kvName}/webhook`,
            async (request, response) =>            
            {

                if (request.headers["aeg-event-type"] === "SubscriptionValidation")
                {

                    const validationResponse = prepareKVWebhookResponse(request);
                    response.status(200);
                    response.send(validationResponse);
                    return;
                }

                const webhookConfig = {};
                webhookConfig.kvName = requestParams.kvName;                
                webhookConfig.namespaceName = requestParams.namespaceName;
                webhookConfig.k8sSecretName = requestParams.k8sSecretName;
                webhookConfig.headers = requestParams.config.headers;

                try
                {

                    const successInfo = await processKVWebhookResponse
                                              (request, webhookConfig);
                    console.log(successInfo);
                    response.status(204);
                    response.send({});

                }
                catch(errorInfo)
                {

                    response.status(500);
                    response.send({});

                }
            });
            
            response.status(204);
            response.send({});

        });

        _self.applicationInfo.routerInfo.post(`${_self.validationURL}`,
        async (request, response) =>
        {
            
            const validationResponse = processK8sValidationResponse(request);
            response.status(200);
            response.send(JSON.stringify(validationResponse));

            await prepareSecretsFromCRDAsync();
            
        });

        fetchCRDInfoAsync();

    }
}

module.exports = KVMKeyVaultController;


