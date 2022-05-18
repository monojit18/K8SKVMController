/*jshint esversion: 8 */

const { R_OK } = require("constants");

class k8sKVManagerApp
{

    constructor()
    {

        const _self = this;
        const nodeModulesPathString = "../node_modules/";
        const Http = require("http");
        const Https = require("https");
        const Path = require("path");
        const FS = require("fs");
        const Express = require(nodeModulesPathString + "express");
        const BodyParser = require(nodeModulesPathString + "body-parser");
        const K8s = require(nodeModulesPathString + "@kubernetes/client-node");
        const Axios = require(nodeModulesPathString + "axios");       
        const DotEnv = require(nodeModulesPathString + "dotenv");    
        const KVMKeyVaultController = require("./controllers/kvmKeyVaultController");

        const _express = Express();
        const _httpServer = Http.createServer(_express);

        const privateKey = FS.readFileSync(__dirname + "/certs/kvm-orchs-svc.kvm-ns.svc.key");
        const certificate = FS.readFileSync(__dirname + "/certs/kvm-orchs-svc.kvm-ns.svc.crt");

        const credentials = {key: privateKey, cert: certificate};
        const _httpsServer = Https.createServer(credentials, _express);
        
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
            _httpServer.listen(7081, () =>
            {

                console.log("We have started our server on port 7081");

            });

            _httpsServer.listen(7443, () =>
            {

                console.log("We have started our server on port 7443");

            });

            _httpServer.on("close", () =>
            {
                
                console.log("We are Closing on 7081");    


            });

            _httpsServer.on("close", () =>
            {
                
                console.log("We are Closing on 7443");    


            });

            process.on("SIGINT", () =>
            {
                _httpServer.close();
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

            prepareAPIServer(applicationInfo);

            const k8sAppsV1Api = k8sClient.makeApiClient(K8s.AppsV1Api);
            applicationInfo.k8sAppsV1Api = k8sAppsV1Api;

        };

        const prepareAPIServer = (applicationInfo) =>
        {

            const currentContext = k8sClient.currentContext;
            const selectedContext = k8sClient.contexts.find((contextInfo) =>
            {

                return (contextInfo.name === currentContext);

            });

            const selectedUser = k8sClient.users.find((userInfo) =>
            {

                return (userInfo.name === selectedContext.user);

            });

            const selectedCluster = k8sClient.clusters.find((clusterInfo) =>
            {

                return (clusterInfo.name === selectedContext.cluster);

            });
            
            const certb64 = Buffer.from(selectedUser.certData, "base64");
            const certData = certb64.toString("utf8");

            const keyb64 = Buffer.from(selectedUser.keyData, "base64");
            const keyData = keyb64.toString("utf8");

            const cab64 = Buffer.from(selectedCluster.caData, "base64");
            const caData = cab64.toString("utf8");

            const httpsAgent = new Https.Agent({
                cert: certData,
                key: keyData,
                ca: caData
            });

            const clusterInfo = {};
            clusterInfo.selectedCluster = selectedCluster;
            clusterInfo.selectedUser = selectedUser;
            clusterInfo.httpsAgent = httpsAgent;

            applicationInfo.clusterInfo = clusterInfo;

        };

        const prepareAllControllers = (templatePath) =>
        {            

            prepareKeyVaultController(templatePath);            

        };

        const prepareKeyVaultController = (templatePath) =>
        {

            let applicationInfo = prepareApplicationInfo(templatePath);            
            applicationInfo.Axios = Axios;

            applicationInfo.routerInfo = Express.Router();
            new KVMKeyVaultController(applicationInfo);
            _express.use("/keyvaults", applicationInfo.routerInfo);

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


