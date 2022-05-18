/*jshint esversion: 8 */

const { R_OK } = require("constants");

class k8sKVManagerApp
{

    constructor()
    {

        const _self = this;
        const nodeModulesPathString = "../node_modules/";
        const Https = require("http");
        const Path = require("path");
        const FS = require("fs");
        const Express = require(nodeModulesPathString + "express");
        const BodyParser = require(nodeModulesPathString + "body-parser");
        const K8s = require(nodeModulesPathString + "@kubernetes/client-node");
        const MsRestNodeAuth = require(nodeModulesPathString + "@azure/ms-rest-nodeauth");
        const MsRestAzure = require(nodeModulesPathString + "@azure/ms-rest-azure-js");
        const KeyVaultIdentity = require(nodeModulesPathString + "@azure/identity");
        const KeyVaultSecrets = require(nodeModulesPathString + "@azure/keyvault-secrets");
        const DotEnv = require(nodeModulesPathString + "dotenv");    
        const KVMKeyVaultController = require("./controllers/kvmKeyVaultController");
        const KVMSecretController = require("./controllers/kvmSecretController");

        const _express = Express();
        const _httpsServer = Https.createServer(_express);
        let k8sClient = {};

        const prepareApplicationInfo = (templatePath) =>
        {
            
            let applicationInfo = {};
            applicationInfo.yamlsPath = templatePath + "/yamls";

            prepareK8sAPIClient(applicationInfo);
            applicationInfo.routerInfo = Express.Router();
            return applicationInfo;

        };

        const prepareTemplatesPath = (pathCallback) =>
        {

            const templateSubPath = "../templates";
            const mountedSubPath = "../mnt/templates";

            const templatePath = Path.join(__dirname, templateSubPath);
            const mountedPath = Path.join(__dirname, mountedSubPath);;

            FS.access(mountedPath, R_OK, (errorInfo) =>
            {

                if (errorInfo == null)
                {

                    pathCallback(mountedSubPath, null);
                    return;

                }

                FS.access(templatePath, R_OK, (errorInfo) =>
                {
                
                    if (errorInfo != null)
                        pathCallback(null, errorInfo);
                    else
                        pathCallback(templateSubPath, null);

                });
            });
        };
        
        const prepareServer = () =>
        {

            _express.use(BodyParser.json());
            _express.use(BodyParser.urlencoded(
            {
                extended: true
                
            }));

            const ENV_FILE = Path.join(__dirname, "../.env");
            DotEnv.config({ path: ENV_FILE });            
            
        };

        const bindServer = () =>
        {            
            _httpsServer.listen(7080, () =>
            {

                console.log("We have started our server on port 7080");

            });

            _httpsServer.on("close", () =>
            {
                
                console.log("We are Closing");    


            });

            process.on("SIGINT", () =>
            {
                _httpsServer.close();

            });        
            
        };

        const prepareK8sAPIClient = (applicationInfo) =>
        {

            const opts = {};
            opts.encoding = "utf8";
            opts.flags = "r";

            const configPath = Path.join(__dirname, applicationInfo.yamlsPath, 
                                         "/config");
            applicationInfo.K8s = K8s;

            k8sClient = new K8s.KubeConfig();
            k8sClient.loadFromFile(configPath, opts);
            const k8sCoreV1Api = k8sClient.makeApiClient(K8s.CoreV1Api);
            applicationInfo.k8sCoreV1Api = k8sCoreV1Api;

            applicationInfo.MsRestNodeAuth = MsRestNodeAuth;
            applicationInfo.MsRestAzure = MsRestAzure;

            applicationInfo.KeyVaultIdentity = KeyVaultIdentity;
            applicationInfo.KeyVaultSecrets = KeyVaultSecrets;

            const yamlSecretPath = Path.join(__dirname, applicationInfo.yamlsPath,
                                             "/template-secret.yaml");
            const yamlSecretString = FS.readFileSync(yamlSecretPath, opts);
            applicationInfo.yamlSecretString = yamlSecretString;

        };

        const prepareKeyVaultController = (templatePath) =>
        {

            let applicationInfo = prepareApplicationInfo(templatePath);
            prepareK8sAPIClient(applicationInfo);

            applicationInfo.routerInfo = Express.Router();
            new KVMKeyVaultController(applicationInfo);
            _express.use("/keyvaults", applicationInfo.routerInfo);

        };

        const prepareSecretController = (templatePath) =>
        {

            let applicationInfo = prepareApplicationInfo(templatePath);
            prepareK8sAPIClient(applicationInfo);

            applicationInfo.routerInfo = Express.Router();
            new KVMSecretController(applicationInfo);
            _express.use("/secrets", applicationInfo.routerInfo);

        };

        const prepareAllControllers = (templatePath) =>
        {            

            prepareKeyVaultController(templatePath);
            prepareSecretController(templatePath);

        };

        prepareServer();
        bindServer();

        prepareTemplatesPath((templatePath, errorInfo) =>
        {

            if (errorInfo == null)
                prepareAllControllers(templatePath);
            else
                console.log(errorInfo);

        });

    }
}

module.exports = new k8sKVManagerApp();


