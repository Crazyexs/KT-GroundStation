import { dir } from "./dir_client.js";

const qs  = (s, r = document) => r.querySelector(s);

const id = {
    graph: {
        xValue: qs('#xValue'),
        yValue: qs('#yValue'),
        xMx: qs('#xMx'),
        xMn: qs('#xMn'),
        yMx: qs('#yMx'),
        yMn: qs('#yMn'),
        container: qs('#graph-grid'),
        button: {
            add: qs('#addGraphBtn'),
            autoAdd: qs('#autoAddGraphBtn'),
            clear: qs('#clearGraphBtn')
        },
        shiftValue: {
            placeholder: qs('#number_of_value'),
            button: qs('#addNumber_of_valueBtn')
        }
    },
    table: qs("#telemetry-table tbody"),
    uplink: {
        selected: qs('#uplink-cmd'),
        placeholder: qs('#cmd-tag'),
        button: qs('#sendBtn')
    },
    monitor: {
        sensor: qs('#value-monitor'),
        command: qs('#monitor')
    },
    map: qs("#map"),
    database: {
        resetDatabaseBtn: qs('#resetDbBtn')
    },
    SerialPort: {
        selected:{
            port:  qs('#portSelect'),
            baudRate: qs('#baud')
        },
        connectBtn: qs('#ConnectBtn'),
        disconnectBtn: qs('#DisconnectBtn')
    },
    boardNow:{
        selected: qs('#boardSelected'),
        button: qs('#boardSelectedBtn')
    },
    localStorage: {
        clearBtn: qs('#clearLocalStorageBtn')
    },
    altitude: {
        valueAlt: qs("#alt--value"),
        graph: qs("#alt--graph")
    },
    stageValue: qs('#stageValue')
}

export { id }