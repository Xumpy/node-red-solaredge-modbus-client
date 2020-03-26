const Net = require('net');
const Modbus = require('modbus-tcp');

inverter_json = [
    [40001, 2, "C_SunSpec_ID", "uint32"],
    [40003, 1, "C_SunSpec_DID", "uint16"],
    [40004, 1, "C_SunSpec_Length", "uint16"],
    [40005, 16, "C_Manufacturer", "String(32)"],
    [40021, 16, "C_Model", "String(32)"],
    [40045, 8, "C_Version", "String(16)"],
    [40053, 16, "C_SerialNumber", "String(32)"],
    [40069, 1, "C_DeviceAddress", "uint16"],
    [40070, 1, "C_SunSpec_DID", "uint16"],
    [40071, 1, "C_SunSpec_Length", "uint16"],
    [40072, 1, "I_AC_Current", "uint16"],
    [40073, 1, "I_AC_CurrentA", "uint16"],
    [40074, 1, "I_AC_CurrentB", "uint16"],
    [40075, 1, "I_AC_CurrentC", "uint16"],
    [40076, 1, "I_AC_Current_SF", "int16"],
    [40077, 1, "I_AC_VoltageAB", "uint16"],
    [40078, 1, "I_AC_VoltageBC", "uint16"],
    [40079, 1, "I_AC_VoltageCA", "uint16"],
    [40080, 1, "I_AC_VoltageAN", "uint16"],
    [40081, 1, "I_AC_VoltageBN", "uint16"],
    [40082, 1, "I_AC_VoltageCN", "uint16"],
    [40083, 1, "I_AC_Voltage_SF", "int16"],
    [40084, 1, "I_AC_Power", "int16"],
    [40085, 1, "I_AC_Power_SF", "int16"],
    [40086, 1, "I_AC_Frequency", "uint16"],
    [40087, 1, "I_AC_Frequency_SF", "int16"],
    [40088, 1, "I_AC_VA", "int16"],
    [40089, 1, "I_AC_VA_SF", "int16"],
    [40090, 1, "I_AC_VAR", "int16"],
    [40091, 1, "I_AC_VAR_SF", "int16"],
    [40092, 1, "I_AC_PF", "int16"],
    [40093, 1, "I_AC_PF_SF", "int16"],
    [40094, 2, "I_AC_Energy_WH", "acc32"],
    [40096, 1, "I_AC_Energy_WH_SF", "uint16"],
    [40097, 1, "I_DC_Current", "uint16"],
    [40098, 1, "I_DC_Current_SF", "int16"],
    [40099, 1, "I_DC_Voltage", "uint16"],
    [40100, 1, "I_DC_Voltage_SF", "int16"],
    [40101, 1, "I_DC_Power", "int16"],
    [40102, 1, "I_DC_Power_SF", "int16"],
    [40104, 1, "I_Temp_Sink", "int16"],
    [40107, 1, "I_Temp_SF", "int16"],
    [40108, 1, "I_Status", "uint16"],
    [40109, 1, "I_Status_Vendor", "uint16"],
    [40110, 2, "I_Event_1", "uint32"],
    [40112, 2, "I_Event_2", "uint32"],
    [40114, 2, "I_Event_1_Vendor", "uint32"],
    [40116, 2, "I_Event_2_Vendor", "uint32"],
    [40118, 2, "I_Event_3_Vendor", "uint32"],
    [40120, 2, "I_Event_4_Vendor", "uint32"]
]

function conv_buffer(buffer, index, length, type, device){
    let buf_byte_length = 2;
    let start = (index - device.start - 1) * buf_byte_length;
    let end = start + (length * buf_byte_length);

    switch(type) {
        case "String(16)":
        case "String(32)":
            return Buffer.from(buffer).slice(start, end).toString().replace(/\0.*$/g,'')
            break
        case "uint16":
            return Buffer.from(buffer).slice(start, end).readUInt16BE().toString()
            break
        case "uint32":
        case "acc32":
            return Buffer.from(buffer).slice(start, end).readUInt32BE().toString()
            break
        case "int16":
            return Buffer.from(buffer).slice(start, end).readInt16BE().toString()
            break
        case "int32":
            return Buffer.from(buffer).slice(start, end).readInt32BE().toString()
            break
    }
}

function fetch_register(modbusClient, start, end){
    return new Promise((resolve, reject) => {
        modbusClient.readHoldingRegisters(1, start, end, (error, buffers) => {
            if (error) throw error;
            resolve(Buffer.concat(buffers));
        });
    });
}

async function fetch_device(modbusClient, module, mapping_json, node, config){
    let device = {
        start: mapping_json[0][0] - 1,
        end: mapping_json[mapping_json.length - 1][0] + mapping_json[mapping_json.length - 1][1] - 1
    }
    let result = {NM_Module: module};
    await fetch_register(modbusClient, device.start, device.end).then(buffer => {
        node.status({fill:"green",shape:"dot",text:"connected"});

        mapping_json.map(map => {
            result[map[2]] = conv_buffer(buffer, map[0], map[1], map[3], device);
        })
        node.send({payload: result});
        setTimeout(function () {
            fetch_device(modbusClient, module, mapping_json, node, config);
        }, config.poll);
    }).catch(error => {
        node.send(error);
        fetch_device(modbusClient, module, mapping_json, node, config);
    });
}

function exception_handler(config, node, error){
    node.error(error);
    node.status({fill:"red",shape:"ring",text:"disconnected"});
    var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
    console.log(node);
    if (!node.stopped) (async () => { await wait(1000); connect_and_fetch(config, node); })()
}

async function connect_and_fetch(config, node){
    let socket;
    node.on('close', function(){ node.stopped = true; socket.destroy(); });
    try{
        socket = Net.connect({ host: config.host, port: config.port });
        let modbusClient= new Modbus.Client();

        node.on('error', function(error){ socket.destroy(); exception_handler(config, node, error); });
        socket.on('error', function(error){ socket.destroy(); exception_handler(config, node, error); });
        modbusClient.on( 'error', function(error){ socket.destroy(); exception_handler(config, node, error); });

        modbusClient.writer().pipe(socket);
        socket.pipe(modbusClient.reader());

        fetch_device(modbusClient, "inverter", inverter_json, node, config);
    } catch (error){
        exception_handler(config, node, error);
    }
}

module.exports = function(RED) {
    function start_node(config){
        RED.nodes.createNode(this,config);
        let node = this;
        node.stopped = false;
        node.status({fill:"red",shape:"ring",text:"disconnected"});

        connect_and_fetch(config, node);
    }

    RED.nodes.registerType("se-modbus",start_node);
}

module.exports.console = function(host, port, poll){
    let config = {
        host: host,
        port: port,
        poll: poll
    }

    node = {
        status: function(status){},
        on: function(event, fun){},
        send: function(data){
            console.log(data);
        },
        error: function(data){
            console.error(data);
        }
    }

    connect_and_fetch(config, node);
}