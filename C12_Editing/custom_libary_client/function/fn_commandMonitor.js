const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function updateCommandMonitor(){
    const output = id.monitor.command;


    console.log('Received command data:', data);
    const line = document.createElement("div");
    line.textContent =
        `${data[data.boardNow].command.command}`;  
    output.appendChild(line);

    // keep only last 200 lines (optional, prevents memory bloat)
    if (output.childNodes.length > 200) {
        output.removeChild(output.firstChild);
    }
    output.scrollTop = output.scrollHeight;
}

export function syncData_commandMonitor(dataIn){
    data = dataIn;
}