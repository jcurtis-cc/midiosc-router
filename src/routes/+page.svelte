<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    import OSC from 'osc-js';
    
    let midiInputs: WebMidi.MIDIInput[] = [];
    let midiinSelected: string = '';
    let midiinStream: string[] = [];
    let oscOutStream: string[] = [];
    let midiAccess: WebMidi.MIDIAccess | null = null;
    let port: number = 9000;
    let portSelected: number = 9000;
    let osc: OSC | null = null;
    let oscStatus = false;
    let statusMessage = '';

    function startOSC() {
        const options = {
            plugin: new OSC.WebsocketClientPlugin({
                host: 'localhost',
                port: 8081,
            }),
        };
        osc = new OSC(options);
        osc.open();

        osc.on('open', () => {
            const msg = 'OSC connection opened';
            console.log(msg);
            updateStatus(msg);
            oscStatus = true;
        });

        osc.on('error', (error) => {
            const msg = 'OSC connection error';
            updateStatus(msg);
            console.error(msg, error);
            oscStatus = false;
        });

        osc.on('close', () => {
            updateStatus('OSC connection closed');
            oscStatus = false;
        });
    }

    async function getMidiDevices() {
        if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
            try {
                midiAccess = await navigator.requestMIDIAccess();
                const inputs = midiAccess.inputs.values();
                for (let input of inputs) {
                    midiInputs = [...midiInputs, input];
                }
            } catch (err) {
                const msg = 'Failed to get MIDI access';
                updateStatus(msg);
                console.error(msg, err);
            }
        } else {
            const msg = 'Web MIDI API is not supported in this browser.';
            updateStatus(msg);
            console.error(msg);
        }
    }

    function handleMIDIMessage(event) {
        const [status, data1, data2] = event.data;
        if (osc && osc.status() === OSC.STATUS.IS_OPEN) {
            const message = new OSC.Message('/midi', status, data1, data2);
            osc.send(message);
            oscOutStream = [`${event.timeStamp.toFixed(2)} Sent localhost:${portSelected} /midi ${status} ${data1} ${data2}`, ...oscOutStream.slice(0, 19)];
        } else {
            updateStatus('OSC connection is not open...');
            oscStatus = false;
        }
        midiinStream = [`${event.timeStamp.toFixed(2)} Status: ${status}, Data1: ${data1}, Data2: ${data2}`, ...midiinStream.slice(0, 19)];
    }

    function selectMIDIInput() {
        if (midiAccess) {
            const selectedInput = midiInputs.find(input => input.name === midiinSelected);
            if (selectedInput) {
                selectedInput.onmidimessage = handleMIDIMessage;
            }
        }
    }

    function updateStatus(message) {
        statusMessage = message;
        setTimeout(() => {
            statusMessage = '';
        }, 2000);
    }

    if (typeof window !== 'undefined') {
        getMidiDevices();
    }

    $: oscStatusIcon = oscStatus ? '✅' : '❌';

    $: if (midiinSelected) {
        selectMIDIInput();
    }
</script>

<h1>🎛️ MidiOsc Router</h1>
<div class="wrapper">
{#if statusMessage}
    <p class="status" transition:fade>{statusMessage}</p>
{/if}
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 1em">
  <div>
    <h2>midi in ↩️</h2>
    <select id="midiin" bind:value={midiinSelected}>
        {#each midiInputs as input}
        <option value={input.name}>{input.name}</option>
        {/each}
    </select> 

    <div>
        <p>
        {#each midiinStream as msg}
            <p class="datastream">{msg}</p>
        {/each}
        </p>
    </div>
  </div>

  <div>
    <h2>osc out ↪️ {oscStatusIcon}</h2>
    <form method="POST" action="?/start" use:enhance={({ formElement, formData, action, cancel, submitter }) => {
		return async ({ result, update }) => {
            if (result.status && result.status >= 200 && result.status < 300) {
                startOSC();
                portSelected = port;
                oscStatus = true;
            } else {
                oscStatus = false;
            }
		};
	}}>
        <input type="number" name="port" bind:value={port} min="8000" max="11000" />
        <button>{oscStatus ? 'Change Port' : 'Start'}</button>
    </form>
    <div>
        <p>
        {#each oscOutStream as msg}
            <p class="datastream">{msg}</p>
        {/each}
        </p>
    </div>
  </div>
</div>

<style>
    :global(body) {
        font-family: 'Arial', sans-serif;
        margin: 1em;
        background-color: #333;
        color: #fff;
    }
    .wrapper {
        min-height: 1.1em;
        margin: 0em;
        overflow: hidden;
    }
    .status {
        font-family: 'Arial', sans-serif;
        font-size:1em;
        margin: 0;
    }
    .datastream {
        font-family: 'Arial', sans-serif;
        font-size:small;
        margin: 0.75%;
    }
</style>