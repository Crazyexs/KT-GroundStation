const qs  = (s, r = document) => r.querySelector(s);

const elementId = {
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
            placeholder: qs('number_of_value'),
            button: qs('addNumber_of_valueBtn')
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
    map: document.elementId(""),
    database: {
        resetDatabaseBtn: qs('resetDbBtn')
    },
    SerialPort: {
        selected:{
            port:  qs('#port-label'),
            baudRate: qs('#baud')
        },
        connectBtn: qs('[data-btn="serial-request"]'),
        disconnectBtn: qs('[data-btn="serial-disconnect"]')
    },
    boardNow:{
        selected: qs(''),
        button: qs('')
    }
}

export { elementId }