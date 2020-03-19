let SolarEdgeModbusClient = require('solaredge-modbus-client')
const fs = require('fs');
const poller = require('./poller');

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
        node.on('input', function(msg) {
			msg.payload = "started";
			node.send(msg);

			let poller = new Poller(1000);
			poller.onPoll(() => {
				const RELAVENT_DATA = [
					'C_Manufacturer',
					'C_Model',
					'C_Version',
					'C_SerialNumber',
					'I_AC_Current',
					'I_AC_VoltageAB',
					'I_AC_Power',
					'I_AC_Energy_WH',
					'I_DC_Current',
					'I_DC_Voltage',
					'I_DC_Power',
					'I_Temp_Sink'
				];
				
				let results = [];
				
				//msg.payload = solar.getData();
				msg.payload = JSON.parse(fs.readFileSync('mock.json'));
				node.send(msg);
				poller.poll(); // Go for the next poll
			});

			// Initial start
			poller.poll();
        });
    }
    RED.nodes.registerType("solaredge-modbus",getModbusData);
}
