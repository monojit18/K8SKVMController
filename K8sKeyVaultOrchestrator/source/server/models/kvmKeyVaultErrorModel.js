/*jshint esversion: 8 */

class KVMKeyVaultErrorModel
{

    constructor(errorInfo)
    {

        if (errorInfo == null)
            return {};

        if (errorInfo.response == null)
        {

            this.code = errorInfo.code;
            this.message = errorInfo.message;
            return;

        }
                
        this.message = errorInfo.response.statusText;        

    }

}

module.exports = KVMKeyVaultErrorModel;