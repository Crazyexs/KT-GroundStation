const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function updateCommandMonitor(){
    socket.on('cmd-data', (data) => {
    console.log('Received command data:', data);
    const line = document.createElement("div");
    line.textContent =
        `${data.monitor.command}`;  
    output.appendChild(line);

    // keep only last 200 lines (optional, prevents memory bloat)
    if (output.childNodes.length > 200) {
        output.removeChild(output.firstChild);
    }
    output.scrollTop = output.scrollHeight;

    });
}

export function syncData_commandMonitor(dataIn){
    data = dataIn;
}