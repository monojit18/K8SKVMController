/*jshint esversion: 8 */

class KVMErrorModel
{

    constructor(errorInfo)
    {

        if (errorInfo == null)
            return {};

        if ((errorInfo.response == null))
        {

            if (errorInfo.details == null)
            {

                this.code = errorInfo.code;
                this.message = errorInfo.message;
                return;
            }
            
            this.code = errorInfo.details.error.code;
            this.message = errorInfo.details.error.message;
            return;

        }

        this.code = errorInfo.response.parsedBody.error.code;
        this.message = errorInfo.response.parsedBody.error.message;
        this.status = errorInfo.response.status;        

    }

}

module.exports = KVMErrorModel;