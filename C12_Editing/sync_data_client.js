let data = {};

export function initSyncData(data_setting){
    data.portAvailable = null;
    data.boardNow = null;
    for (let name of Object.keys(data_setting)) {
        data[name] = {
            data_format: data_setting.data_format,
            sensor:{
                dataIn: {},
                dataType: {}
            },
            command:{
                counter: null,
                command: null
            }
        };
        for(let [dataName,dataType] of Object.entries(data_setting.data_format)){
            data[name].sensor.dataIn[dataName] = null;
            data[name].sensor.dataType[dataName] = dataType;
        }
    }
    return data;
}