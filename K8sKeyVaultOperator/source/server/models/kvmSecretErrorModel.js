/*jshint esversion: 8 */

class KVMSecretErrorModel
{

    constructor(errorInfo)
    {

        if (errorInfo == null)
            return {};

        if ((errorInfo.response == null) || (errorInfo.response.body == null))
        {
            
            this.code = errorInfo.code;
            this.message = errorInfo.message;
            return;

        }

        this.code = errorInfo.response.body.code;
        this.message = errorInfo.response.body.message; 
        this.status = errorInfo.response.body.status; 
        this.reason = errorInfo.response.body.reason;        

    }
}

module.exports = KVMSecretErrorModel;