const Net = require('net');
const Modbus = require('modbus-tcp');
const fs = require('fs');

module.exports = function(RED) {
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
        let result = [{id: "NM_Module", value: module}]
        await fetch_register(modbusClient, device.start, device.end).then(buffer => {
            mapping_json.map(map => {
                result.push({
                    id: map[2],
                    value: conv_buffer(buffer, map[0], map[1], map[3], device)
                });
            })
            node.send(result);
            setTimeout(function () {
                fetch_device(modbusClient, module, mapping_json, node, config);
            }, config.poll);
        }).catch(error => {
            node.send(error);
            fetch_device(modbusClient, module, mapping_json, node, config);
        });
    }

    function start_node(config){
        RED.nodes.createNode(this,config);
        var node = this;
        var socket = Net.connect({ host: config.host, port: config.port })
        var modbusClient= new Modbus.Client()

        node.on('close', function (){
            socket.destroy();
        });
        node.on('error', function(){
            node.send(error);
            socket.destroy();
            start_node(node, config);
        })
        socket.on("error", (error) => { node.error(error); });
        modbusClient.on("error", (error) => { node.error(error); });

        modbusClient.writer().pipe(socket)
        socket.pipe(modbusClient.reader())

        fetch_device(modbusClient, "inverter", JSON.parse(fs.readFileSync("./se-inverter.json")), node, config);
    }

    RED.nodes.registerType("se-modbus-json",start_node);
}