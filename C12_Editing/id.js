import { resetDatabase } from "../custom_libary_server/function/fn_database";

const elementId = {
    graph: {
        xValue: document.getElementById('xValue'),
        yValue: document.getElementById('yValue'),
        xMx: document.getElementById('xMx'),
        xMn: document.getElementById('xMn'),
        yMx: document.getElementById('yMx'),
        yMn: document.getElementById('yMn'),
        container: document.getElementById('graphsContainer'),
        button: {
            add: document.getElementById('addGraphBtn'),
            autoAdd: document.getElementById('autoAddGraphBtn'),
            clear: document.getElementById('clearGraphBtn')
        },
        shiftValue: {
            placeholder: document.getElementById('number_of_value'),
            button: document.getElementById('addNumber_of_valueBtn')
        }
    },
    table: document.getElementById("dataTable"),
    uplink: {
        selected: document.getElementById('commandSelect'),
        button: document.getElementById('sendBtn')
    },
    monitor: {
        sensor: document.getElementById('output'),
        command: document.getElementById('output_cmd');
    },
    map: document.elementId(""),
    database: {
        resetDatabaseBtn: document.getElementById('resetDbBtn')
    },
    SerialPort: {
        portSelected: document.getElementById('portSelect'),
        connectBtn: document.getElementById('ConnectBtn'),
        disconnectBtn: document.getElementById('DisconnectBtn')
    }
}

export { elementId }