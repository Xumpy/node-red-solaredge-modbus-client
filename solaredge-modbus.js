let SolarEdgeModbusClient = require('solaredge-modbus-client')
const fs = require('fs');

/*
let solar = new SolarEdgeModbusClient({
    host: "192.168.1.200",
    port: 1502
})
*/

module.exports = function(RED) {
    function fetchFromArray(array, name){
		array.filter(result => (result.name === name));
	}
	
	function getModbusData(config) {
        RED.nodes.createNode(this,config);
        var node = this;
		setInterval(() => {
			const RELAVENT_DATA = [
					'',
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
			
			modbus = JSON.parse(fs.readFileSync('mock.json'));
			var msg = {
				payload: {
					'C_Manufacturer': fetchFromArray(modbus, 'I_AC_Energy_WH').value
				}
			};
			node.send(msg);
		}, 1000);
    }
    RED.nodes.registerType("solaredge-modbus",getModbusData);
}
