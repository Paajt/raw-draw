import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000');

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	const server = createServer((req, res) => {
		handle(req, res);
	});

	// Skapa WS-server WITHOUT att koppla den till HTTP-servern direkt
	const wss = new WebSocketServer({ noServer: true });

	wss.on('connection', (ws) => {
		console.log('New client connected');

		ws.on('message', (data) => {
			wss.clients.forEach((client) => {
				if (client !== ws && client.readyState === 1) {
					client.send(data.toString());
				}
			});
		});

		ws.on('close', () => {
			console.log('Client disconnected');
		});
	});

	// Fånga BARA upgrade-requests till /ws
	server.on('upgrade', (req, socket, head) => {
		if (req.url === '/ws') {
			wss.handleUpgrade(req, socket, head, (ws) => {
				wss.emit('connection', ws, req);
			});
		}
		// Alla andra upgrade-requests (t.ex. HMR) lämnas ifred
	});

	server.listen(port, () => {
		console.log(`> Server running on http://localhost:${port}`);
		console.log(`> WebSocket server ready on ws://localhost:${port}/ws`);
	});
});
