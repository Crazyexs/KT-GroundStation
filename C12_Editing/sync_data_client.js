let data = {};

export function initSyncData(data_setting,db){
    for (let name of Object.keys(data_setting)) {
        data[name] = {
            connectOrNot: false,
            COM_PORT: null,
            baudRate: null,
            db: null,
            data_format: data_setting.data_format,
            dataIn: {},
            dataType: {}
        };
        for(let [dataName,dataType] of Object.entries(data_setting.data_format)){
            data[name].dataIn[dataName] = null;
            data[name].dataType[dataName] = dataType;
        }
    }
    return data;
}