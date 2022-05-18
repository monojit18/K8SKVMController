/*jshint esversion: 8 */

class KVMCrdModel
{

    constructor(validationInfo)
    {

        this.access = validationInfo.access;
        this.deployments = validationInfo.deployments;
        this.webhook =  validationInfo.webhook;

    }

}

module.exports = KVMCrdModel;