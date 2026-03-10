import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000');

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	const wss = new WebSocketServer({ noServer: true });

	// Broadcast till alla anslutna klienter
	function broadcast(data: string) {
		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
	}

	wss.on('connection', (ws) => {
		console.log('New client connected');

		ws.on('message', (data) => {
			wss.clients.forEach((client) => {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(data.toString());
				}
			});
		});

		ws.on('close', () => {
			console.log('Client disconnected');
		});
	});

	// Hjälpfunktion för att läsa request body
	function readBody(req: IncomingMessage): Promise<string> {
		return new Promise((resolve) => {
			let body = '';
			req.on('data', (chunk) => (body += chunk));
			req.on('end', () => resolve(body));
		});
	}

	const server = createServer(
		async (req: IncomingMessage, res: ServerResponse) => {
			// Hantera våra API-routes direkt i servern
			if (req.method === 'POST' && req.url === '/api/clear') {
				broadcast(JSON.stringify({ type: 'clear-canvas' }));
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(
					JSON.stringify({ success: true, message: 'Canvas cleared' })
				);
				return;
			}

			if (req.method === 'POST' && req.url === '/api/alarm') {
				const raw = await readBody(req);
				const body = JSON.parse(raw || '{}');
				const message = body.message || 'Alarm triggered';
				const severity = body.severity || 'info';

				broadcast(JSON.stringify({ type: 'alarm', message, severity }));
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(
					JSON.stringify({ success: true, message: 'Alarm sent' })
				);
				return;
			}

			// Allt annat → Next.js
			handle(req, res);
		}
	);

	server.on('upgrade', (req, socket, head) => {
		if (req.url === '/ws') {
			wss.handleUpgrade(req, socket, head, (ws) => {
				wss.emit('connection', ws, req);
			});
		}
	});

	server.listen(port, () => {
		console.log(`> Server running on http://localhost:${port}`);
		console.log(`> WebSocket server ready on ws://localhost:${port}/ws`);
	});
});
