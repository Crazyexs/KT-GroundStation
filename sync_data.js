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
            header:data_setting[name].header,
            delimiter: data_setting[name].delimiter
        };
    }
    return data;
}