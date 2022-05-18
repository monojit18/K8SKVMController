/*jshint esversion: 8 */

class KVMErrorModel
{

    constructor(errorInfo)
    {

        if ((errorInfo == null) || (errorInfo.response == null))
            return {};

        this.status =  errorInfo.response.status;
        this.statusText =  errorInfo.response.statusText;

        if (errorInfo.response.data != null)
        {

            this.code = errorInfo.response.data.code;
            this.message = errorInfo.response.data.message;
            this.reason = errorInfo.response.data.reason;            
            
        }

    }

}

module.exports = KVMErrorModel;