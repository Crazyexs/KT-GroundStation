let data = {};

export function initSyncData(data_setting,setting){
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
            delimiter: data_setting[name].delimiter,
            lostTrack: setting.key[name].lostTrack,
            showValue: setting.key[name].showValue,
            shiftValue: 0
        };
    }
    return data;
}