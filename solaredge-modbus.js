let SolarEdgeModbusClient = require('solaredge-modbus-client')
const fs = require('fs');

/*
let solar = new SolarEdgeModbusClient({
    host: "192.168.1.200",
    port: 1502
})
*/

module.exports = function(RED) {
    function fetchValue(array, name){
		return array.filter(result => (result.name === name))[0].value;
	}
	
	function getModbusData(config) {
        RED.nodes.createNode(this,config);
        var node = this;
		setInterval(() => {
			modbus = JSON.parse(fs.readFileSync('mock.json'));
			var msg = {
				payload: {
					'Model': fetchValue(modbus, 'C_Model'),
					'Version': fetchValue(modbus, 'C_Version'),
					'SerialNumbeer': fetchValue(modbus, 'C_SerialNumber'),
					'AC Current phase A': fetchValue(modbus, 'I_AC_CurrentA'),
					'AC Current phase B': fetchValue(modbus, 'I_AC_CurrentB'),
					'AC Current phase C': fetchValue(modbus, 'I_AC_CurrentC'),
					'AC Frequency': fetchValue(modbus, 'I_AC_Frequency'),
					'AC Power output': fetchValue(modbus, 'I_AC_Power'),
					'AC Total Current': fetchValue(modbus, 'I_AC_Current'),
					'AC Voltage phase A-B': fetchValue(modbus, 'I_AC_VoltageAB'),
					'AC Voltage phase A-N': fetchValue(modbus, 'I_AC_VoltageAN'),
					'AC Voltage phase B-C': fetchValue(modbus, 'I_AC_VoltageBC'),
					'AC Voltage phase B-N': fetchValue(modbus, 'I_AC_VoltageBN'),
					'AC Voltage phase C-A': fetchValue(modbus, 'I_AC_VoltageCA'),
					'AC Voltage phase C-N': fetchValue(modbus, 'I_AC_VoltageCN'),
					'AC Energy Total WH': fetchValue(modbus, 'I_AC_Energy_WH'),
					'DC Current': fetchValue(modbus, 'I_DC_Current'),
					'DC Power input': fetchValue(modbus, 'I_DC_Power'),
					'DC Voltage': fetchValue(modbus, 'I_DC_Voltage'),
					'Inverter Temperature':fetchValue(modbus, 'I_Temp_Sink')
				}
			};
			node.send(msg);
		}, 1000);
    }
    RED.nodes.registerType("solaredge-modbus",getModbusData);
}
