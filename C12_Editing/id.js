const elementId = {
    table: document.getElementById("dataTable");
    graph: {
        container: document.getElementById('graphsContainer');
        button: {
            add: document.getElementById('addGraphBtn');
            autoAdd:
            clear:
        }
    }
    monitor: {
        sensor: null,
        command:
    }
    uplink{
        selected: document.getElementById('commandSelect'),
        button: document.getElementById('sendBtn')
    }
}

export { elementId }