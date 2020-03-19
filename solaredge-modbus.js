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
        RED.nodes.createNode(this,config);
        var node = this;
		try{
			let SolarEdgeModbusClient = require('solaredge-modbus-client')
			let solar = new SolarEdgeModbusClient({
				host: config.host,
				port: Number(config.port)
			});

			solar.socket.on("error", (error) => {
				var msg = { error: error }
				node.send(msg);
			});
			
			solar.modbusClient.on("error", (error) => {
				var msg = { error: error }
				node.send(msg);
			});
			
			setInterval(() => {
				try {
					modbus = solar.getData().then((data) => {
						var msg = {
							payload: {
								'Model': fetchValue(data, 'C_Model'),
								'Version': fetchValue(data, 'C_Version'),
								'SerialNumbeer': fetchValue(data, 'C_SerialNumber'),
								'AC Current phase A': numberWithScale(fetchValue(data, 'I_AC_CurrentA'), fetchValue(data, 'I_AC_Current_SF')),
								'AC Current phase B': numberWithScale(fetchValue(data, 'I_AC_CurrentB'), fetchValue(data, 'I_AC_Current_SF')),
								'AC Current phase C': numberWithScale(fetchValue(data, 'I_AC_CurrentC'), fetchValue(data, 'I_AC_Current_SF')),
								'AC Total Current': numberWithScale(fetchValue(data, 'I_AC_Current'), fetchValue(data, 'I_AC_Current_SF')),
								'AC Frequency': numberWithScale(fetchValue(data, 'I_AC_Frequency'), fetchValue(data, 'I_AC_Frequency_SF')),
								'AC Power output': numberWithScale(fetchValue(data, 'I_AC_Power'), fetchValue(data, 'I_AC_Power_SF')),
								'AC Voltage phase A-B': numberWithScale(fetchValue(data, 'I_AC_VoltageAB'), fetchValue(data, 'I_AC_Voltage_SF')),
								'AC Voltage phase A-N': numberWithScale(fetchValue(data, 'I_AC_VoltageAN'), fetchValue(data, 'I_AC_Voltage_SF')),
								'AC Voltage phase B-C': numberWithScale(fetchValue(data, 'I_AC_VoltageBC'), fetchValue(data, 'I_AC_Voltage_SF')),
								'AC Voltage phase B-N': numberWithScale(fetchValue(data, 'I_AC_VoltageBN'), fetchValue(data, 'I_AC_Voltage_SF')),
								'AC Voltage phase C-A': numberWithScale(fetchValue(data, 'I_AC_VoltageCA'), fetchValue(data, 'I_AC_Voltage_SF')),
								'AC Voltage phase C-N': numberWithScale(fetchValue(data, 'I_AC_VoltageCN'), fetchValue(data, 'I_AC_Voltage_SF')),
								'AC Total Energy WH': numberWithScale(fetchValue(data, 'I_AC_Energy_WH'), fetchValue(data, 'I_AC_Energy_WH_SF')),
								'DC Current': numberWithScale(fetchValue(data, 'I_DC_Current'), fetchValue(data, 'I_DC_Current_SF')),
								'DC Power input': numberWithScale(fetchValue(data, 'I_DC_Power'), fetchValue(data, 'I_DC_Power_SF')),
								'DC Voltage': numberWithScale(fetchValue(data, 'I_DC_Voltage'), fetchValue(data, 'I_DC_Voltage_SF')),
								'Inverter Temperature':numberWithScale(fetchValue(data, 'I_Temp_Sink'), fetchValue(data, 'I_Temp_SF'))
							}
						};
						node.send(msg);
					});
				} catch (internal_error) {
					console.log(internal_error);
				}
			}, 1000);
			
			node.on('close', function (){
				solar.socket.destroy();
			});
		} catch (error) {
			console.log(error);
		}
		
    }
    RED.nodes.registerType("solaredge-modbus",getModbusData);
}
	