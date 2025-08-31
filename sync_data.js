let data = {};

export function initSyncData(data_setting,db){
    for (let name of Object.keys(data_setting)) {
        data[name] = {
            connectOrNot: false,
            COM_PORT: null,
            baudRate: null,
            serial: null,
            parser: null,
            db: null,
            data_format: data_setting[name].data_format,
        };
    }
    return data;
}