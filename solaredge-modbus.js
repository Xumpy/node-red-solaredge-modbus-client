let SolarEdgeModbusClient = require('solaredge-modbus-client')
const fs = require('fs');

/*
let solar = new SolarEdgeModbusClient({
    host: "192.168.1.200",
    port: 1502
})
*/

module.exports = function(RED) {
    function getModbusData(config) {
        RED.nodes.createNode(this,config);
        var node = this;
		var msg = {
			payload = "started";
		}
		node.send(msg);
		
		node.on('input', function(msg) {
			msg.payload = "started2";
			node.send(msg);
		});
    }
    RED.nodes.registerType("solaredge-modbus",getModbusData);
}
