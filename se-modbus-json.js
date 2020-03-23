const Net = require('net');
const Modbus = require('modbus-tcp');

var socket = Net.connect({ host: "192.168.1.200", port: 1502 })
var modbusClient= new Modbus.Client()

modbusClient.writer().pipe(socket)
socket.pipe(modbusClient.reader())

function fetch_watt(){
    return new Promise((resolve, reject) => {
        modbusClient.readHoldingRegisters(1, 40083, 40084, (error, buffers) => {
                if (error) throw err;
                resolve(Buffer.concat(buffers).readUInt16BE().toString());
            });
        });
}

async function refetch(){
    await fetch_watt().then(value => {
        console.log(value)
        setTimeout(function () {
            refetch()
        }, 1000);
    });
}

refetch();