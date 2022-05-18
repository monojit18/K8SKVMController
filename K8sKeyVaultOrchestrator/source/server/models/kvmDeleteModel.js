/*jshint esversion: 8 */

class KVMDeleteModel
{

    constructor(deleteInfo)
    {

        if (deleteInfo.details != null)
            this.name = deleteInfo.details.name;
        this.status = deleteInfo.status;
        this.reason = deleteInfo.reason; 

    }

}

module.exports = KVMDeleteModel;