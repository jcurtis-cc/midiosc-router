import * as osc from '$lib/server/oscBridge';

export const actions = {
    start: async ({ cookies, request }) => {
        const data = await request.formData();
        const port = data.get('port');

        if (!port || isNaN(port) || port < 8000 || port > 11000) {
            return { status: 400, message: 'Invalid port number' };
        }

        const success = osc.start(port);

        if (success) {
            return { status: 200, message: `Success starting OSC Bridge on ${port}` };
        } else {
            return { status: 500, message: `Error starting OSC Bridge on ${port}` };
        }
    }
};