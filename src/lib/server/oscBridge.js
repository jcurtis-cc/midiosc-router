import OSC from 'osc-js';

let osc = null;

export function start(port) {
  if (osc) {
    console.log('Closing existing OSC Relay Server.');
    osc.close();
  }

  const config = {
    udpClient: {
      port,
    },
    wsServer: {
      host: '0.0.0.0',
      port: 8081,
    },
  };
  osc = new OSC({ plugin: new OSC.BridgePlugin(config) });

  osc.open();

  osc.on('open', () => {
    console.log(`OSC Relay Server is running within SvelteKit on port ${port}.`);
  });

  osc.on('error', (error) => {
    console.error('OSC Relay Server error:', error);
  });

  osc.on('close', () => {
    console.log('OSC Relay Server has closed.');
  });

  return !!osc;
}
