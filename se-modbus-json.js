function ModbusScanner(){
    const net = require('net');
    const modbus = require('modbus-tcp');

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

    function fetch_register(modbusClient, mapping_json){
        let device = {
            start: mapping_json[0][0] - 1,
            end: mapping_json[mapping_json.length - 1][0] + mapping_json[mapping_json.length - 1][1] - 1
        }

        return new Promise((resolve, reject) => {
            modbusClient.readHoldingRegisters(1, device.start, device.end, (error, buffers) => {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve({
                    mapping_json: mapping_json,
                    buffer: Buffer.concat(buffers),
                    device: device
                });
            });
        });
    }

    function fetch_device(modbusClient, node, config){
        let result = {NM_Module: config.device};
        let per_item = config.json.config.fetch;
        let data = config.json.data;
        let promises = [];

        for (let i=0; i< Math.ceil(data.length / per_item); i++){
            let start_index = i * per_item;
            let stop_index = ((i + 1) * per_item >= data.length ? data.length : (i + 1) * per_item);

            promises.push( fetch_register(modbusClient, data.slice(start_index, stop_index)) );
        }

        Promise.all(promises).then(promise => {
            node.status({fill:"green",shape:"dot",text:"connected"});

            for(let prom of promise){
                prom.mapping_json.map(map => {
                    result[map[2]] = conv_buffer(prom.buffer, map[0], map[1], map[3], prom.device);
                })
            }
            node.send({payload: result});
            setTimeout(function () {
                fetch_device(modbusClient, node, config);
            }, config.poll);
        }).catch(error => {
            node.send(error);
        });
    }

    function exception_handler(config, node, error){
        node.error(error);
        node.status({fill:"red",shape:"ring",text:"disconnected"});
    }

    this.connect_and_fetch = function connect_and_fetch(config, node){
        let socket;
        node.on('close', function(){ node.stopped = true; socket.destroy(); });
        config = device_to_config(config);
        try{
            socket = new net.Socket();
            modbusClient= new modbus.Client();
            modbusClient.writer().pipe(socket);
            socket.pipe(modbusClient.reader());
            socket.connect({ host: config.host, port: config.port });

            socket.on('close', function(){
                var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
                if (!node.stopped) (async () => {
                    await wait(1000); await connect_and_fetch(config, node);
                })(); });
            node.on('error', function(error){ socket.destroy(); exception_handler(config, node, error); });
            socket.on('error', function(error){ socket.destroy(); exception_handler(config, node, error); });
            modbusClient.on( 'error', function(error){ socket.destroy(); exception_handler(config, node, error); });


            fetch_device(modbusClient, node, config);
        } catch (error){
            exception_handler(config, node, error);
        }
    }
}


function device_to_config(config){
    switch (config.device) {
        case "se_inverter": config.json = require('./config_json/se_inverter.json'); break; // Credits to Brad Slattman
        case "em_300": config.json = require('./config_json/em_300.json'); break;
    }

    return config;
}

module.exports = function(RED) {
    function start_node(config){
        RED.nodes.createNode(this,config);
        let node = this;
        node.stopped = false;
        node.status({fill:"red",shape:"ring",text:"disconnected"});

        if (config.device === undefined) {config.device = "se_inverter"; }

        new ModbusScanner().connect_and_fetch(config, node);
    }

    RED.nodes.registerType("se-modbus",start_node);
}

module.exports.console = function(host, port, poll, device){
    let config = {
        host: host,
        port: port,
        poll: poll,
        device: device
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

    new ModbusScanner().connect_and_fetch(config, node);
}