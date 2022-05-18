/*jshint esversion: 8 */

class KVMDeployModel
{

    constructor(deployInfo)
    {

        this.name = deployInfo.metadata.name;
        this.namespace = deployInfo.metadata.namespace;        
        this.labels = deployInfo.metadata.labels;
        this.replicas = deployInfo.spec.replicas;
        this.selector = deployInfo.spec.selector;
        this.strategy = deployInfo.spec.strategy;

        this.template = {};
        this.template.metadata = deployInfo.spec.template.metadata;
        this.template.specs = {};
        this.template.specs.name = deployInfo.spec.template.spec.containers[0].name;
        this.template.specs.image = deployInfo.spec.template.spec.containers[0].image;
        this.template.specs.imagePullPolicy = deployInfo.spec.template.spec.containers[0].imagePullPolicy;
        this.template.specs.resources = deployInfo.spec.template.spec.containers[0].resources;
        this.template.specs.nodepool = deployInfo.spec.template.spec.nodeSelector.agentpool;

    }
}

module.exports = KVMDeployModel;