/*jshint esversion: 8 */

const KVMController = require("./kvmController");
const KVMSecretErrorModel = require("../models/kvmSecretErrorModel");
const KVMDeleteModel = require("../models/kvmDeleteModel");
const KVMSecretModel = require("../models/kvmSecretModel");
const KVMSecretModelList = require("../models/kvmSecretModelsList");

class KVMSecretController extends KVMController
{
    
    constructor(applicationInfo)
    {

        super(applicationInfo);
        const _self = this;

        this.scBaseURL = "/:secretName/namespaces/:namespaceName";
        this.scNamespaceURL = "/namespaces/:namespaceName";

        const prepareSecretBody = (request) =>
        {

            const secretName = request.params.secretName;
            const namespaceName = request.params.namespaceName;
            const yamlSecretString = _self.applicationInfo.yamlSecretString;
            const K8s = _self.applicationInfo.K8s;
            
            const yamlSecret = K8s.loadYaml(yamlSecretString);
            yamlSecret.metadata.name =  secretName;
            yamlSecret.metadata.labels.group = namespaceName;
            
            const secretData = {};
            const allSecrets = request.body;
            allSecrets.forEach((secretInfo) =>
            {
                
                secretData[secretInfo.key] = secretInfo.value;

            });

            yamlSecret.data = secretData;

            const secretBody = {};
            secretBody.secretName = secretName;
            secretBody.namespaceName = namespaceName;
            secretBody.yamlSecret = yamlSecret;
            return secretBody;

        };

        _self.applicationInfo.routerInfo.get(_self.scBaseURL,
        async (request, response) =>
        {
            
            try
            {

                const secretName = request.params.secretName;            
                const namespaceName = request.params.namespaceName;
                
                const res = await _self.applicationInfo.k8sCoreV1Api.readNamespacedSecret
                                  (secretName, namespaceName);

                const secretInfo = new KVMSecretModel(res.body);
                if (secretInfo == null)
                {

                    response.status(res.response.statusCode);
                    response.send({});
                    return;
                }                

                response.status(res.response.statusCode);
                response.send(secretInfo);

            }
            catch(ex)
            {
                
                const errorInfo = new KVMSecretErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode : 500);
                response.send(errorInfo);

            }
        });

        _self.applicationInfo.routerInfo.get(_self.scNamespaceURL,
        async (request, response) =>
        {

            try
            {

                const namespaceName = request.params.namespaceName;
            
                const res = await _self.applicationInfo.k8sCoreV1Api.listNamespacedSecret
                                  (namespaceName);
                
                const secretInfoList = new KVMSecretModelList(res.body);
                response.status(res.response.statusCode);
                response.send(secretInfoList);

            }
            catch(ex)
            {
                
                const errorInfo = new KVMSecretErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode : 500);
                response.send(errorInfo);

            }
        });

        _self.applicationInfo.routerInfo.put(_self.scBaseURL,
        async (request, response) =>
        {                                                

            try
            {

                const secretBody = prepareSecretBody(request);

                const res = await _self.applicationInfo.k8sCoreV1Api.createNamespacedSecret
                                  (secretBody.namespaceName, secretBody.yamlSecret);

                const secretInfo = new KVMSecretModel(res.body);
                response.status(res.response.statusCode);
                response.send(secretInfo);

            }
            catch(ex)
            {
                
                const errorInfo = new KVMSecretErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode : 500);
                response.send(errorInfo);

            }
        });

        _self.applicationInfo.routerInfo.patch(_self.scBaseURL,
        async (request, response) =>
        {

            try
            {

                const secretBody = prepareSecretBody(request);
                const options = {};
                options.headers =
                {
                    
                    "Content-Type": "application/merge-patch+json"

                };

                const res = await _self.applicationInfo.k8sCoreV1Api.patchNamespacedSecret
                                  (secretBody.secretName, secretBody.namespaceName,
                                    secretBody.yamlSecret, undefined, undefined, undefined,
                                    undefined, options);

                const secretInfo = new KVMSecretModel(res.body);
                response.status(res.response.statusCode);
                response.send(secretInfo);

            }
            catch(ex)
            {
                
                const errorInfo = new KVMSecretErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode : 500);
                response.send(errorInfo);

            }
        });

        _self.applicationInfo.routerInfo.delete(_self.scBaseURL,
        async (request, response) =>
        {     
            
            try
            {

                const secretName = request.params.secretName;
                const namespaceName = request.params.namespaceName;

                const res = await _self.applicationInfo.k8sCoreV1Api.deleteNamespacedSecret
                                  (secretName, namespaceName);
                
                const deleteInfo = new KVMDeleteModel(res.body);
                response.status(res.response.statusCode);
                response.send(deleteInfo);

            }
            catch(ex)
            {
                
                const errorInfo = new KVMSecretErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode : 500);
                response.send(errorInfo);

            }
        });

        _self.applicationInfo.routerInfo.delete(_self.scNamespaceURL,
        async (request, response) =>
        {                                    

            try
            {

                const namespaceName = request.params.namespaceName;
                const labelSelector = `group=${namespaceName}`;

                const res = await _self.applicationInfo.k8sCoreV1Api
                                  .deleteCollectionNamespacedSecret
                                  (namespaceName, undefined, undefined, undefined,
                                  undefined, undefined, labelSelector);

                const deleteInfo = new KVMDeleteModel(res.body);
                response.status(res.response.statusCode);
                response.send(deleteInfo);

            }
            catch(ex)
            {
                
                const errorInfo = new KVMSecretErrorModel(ex);
                response.status((ex.statusCode != null) ? ex.statusCode : 500);
                response.send(errorInfo);

            }
        });
    }
}

module.exports = KVMSecretController;