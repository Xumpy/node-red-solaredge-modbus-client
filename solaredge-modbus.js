let SolarEdgeModbusClient = require('solaredge-modbus-client')

module.exports = function(RED) {
	function numberWithScale(input, strScale){
		var value = Number(input);
		var scale = Math.pow(10, Number(strScale));
		
		return  parseFloat((value * scale).toFixed(Math.abs(Number(strScale))));
	}
    function fetchValue(array, name){
		return array.filter(result => (result.name === name))[0].value;
	}
	
	function getModbusData(config) {
		let solar = new SolarEdgeModbusClient({
			host: config.host,
			port: config.port
		})

        RED.nodes.createNode(this,config);
        var node = this;
		setInterval(() => {
			modbus = solar.getData().then((data) => {
				var msg = {
					payload: {
						'Model': fetchValue(modbus, 'C_Model'),
						'Version': fetchValue(modbus, 'C_Version'),
						'SerialNumbeer': fetchValue(modbus, 'C_SerialNumber'),
						'AC Current phase A': numberWithScale(fetchValue(modbus, 'I_AC_CurrentA'), fetchValue(modbus, 'I_AC_Current_SF')),
						'AC Current phase B': numberWithScale(fetchValue(modbus, 'I_AC_CurrentB'), fetchValue(modbus, 'I_AC_Current_SF')),
						'AC Current phase C': numberWithScale(fetchValue(modbus, 'I_AC_CurrentC'), fetchValue(modbus, 'I_AC_Current_SF')),
						'AC Total Current': numberWithScale(fetchValue(modbus, 'I_AC_Current'), fetchValue(modbus, 'I_AC_Current_SF')),
						'AC Frequency': numberWithScale(fetchValue(modbus, 'I_AC_Frequency'), fetchValue(modbus, 'I_AC_Frequency_SF')),
						'AC Power output': numberWithScale(fetchValue(modbus, 'I_AC_Power'), fetchValue(modbus, 'I_AC_Power_SF')),
						'AC Voltage phase A-B': numberWithScale(fetchValue(modbus, 'I_AC_VoltageAB'), fetchValue(modbus, 'I_AC_Voltage_SF')),
						'AC Voltage phase A-N': numberWithScale(fetchValue(modbus, 'I_AC_VoltageAN'), fetchValue(modbus, 'I_AC_Voltage_SF')),
						'AC Voltage phase B-C': numberWithScale(fetchValue(modbus, 'I_AC_VoltageBC'), fetchValue(modbus, 'I_AC_Voltage_SF')),
						'AC Voltage phase B-N': numberWithScale(fetchValue(modbus, 'I_AC_VoltageBN'), fetchValue(modbus, 'I_AC_Voltage_SF')),
						'AC Voltage phase C-A': numberWithScale(fetchValue(modbus, 'I_AC_VoltageCA'), fetchValue(modbus, 'I_AC_Voltage_SF')),
						'AC Voltage phase C-N': numberWithScale(fetchValue(modbus, 'I_AC_VoltageCN'), fetchValue(modbus, 'I_AC_Voltage_SF')),
						'AC Total Energy WH': numberWithScale(fetchValue(modbus, 'I_AC_Energy_WH'), fetchValue(modbus, 'I_AC_Energy_WH_SF')),
						'DC Current': numberWithScale(fetchValue(modbus, 'I_DC_Current'), fetchValue(modbus, 'I_DC_Current_SF')),
						'DC Power input': numberWithScale(fetchValue(modbus, 'I_DC_Power'), fetchValue(modbus, 'I_DC_Power_SF')),
						'DC Voltage': numberWithScale(fetchValue(modbus, 'I_DC_Voltage'), fetchValue(modbus, 'I_DC_Voltage_SF')),
						'Inverter Temperature':numberWithScale(fetchValue(modbus, 'I_Temp_Sink'), fetchValue(modbus, 'I_Temp_SF'))
					}
				};
				node.send(msg);
			});
		}, 1000);
		
		node.on('close', function (){
			solar.socket.destroy();
		});
    }
    RED.nodes.registerType("solaredge-modbus",getModbusData);
}
	