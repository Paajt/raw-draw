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

	// Håll koll på anslutna användare
	const users = new Map<
		import('ws').WebSocket,
		{ userId: string; color: string }
	>();

	// SSE: Håll koll på anslutna SSE-klienter och händelselogg
	const sseClients = new Set<import('http').ServerResponse>();
	const eventLog: { time: string; event: string }[] = [];

	function logEvent(event: string) {
		const entry = { time: new Date().toISOString(), event };
		eventLog.push(entry);
		// Skicka till alla SSE-klienter
		sseClients.forEach((res) => {
			res.write(`data: ${JSON.stringify(entry)}\n\n`);
		});
	}

	wss.on('connection', (ws) => {
		console.log('New client connected');
		logEvent('New client connected');

		// Skicka befintliga användare till den nya klienten
		users.forEach((user) => {
			ws.send(
				JSON.stringify({
					type: 'user-joined',
					userId: user.userId,
					color: user.color,
					userCount: users.size,
				})
			);
		});

		ws.on('message', (data) => {
			const message = JSON.parse(data.toString());

			// Registrera användare vid första draw-meddelandet
			if (message.type === 'draw' && !users.has(ws)) {
				users.set(ws, { userId: message.userId, color: message.color });
				logEvent(
					`${message.userId} joined with color ${message.color}`
				);

				// Meddela alla att en ny användare anslöt
				broadcast(
					JSON.stringify({
						type: 'user-joined',
						userId: message.userId,
						color: message.color,
						userCount: users.size,
					})
				);
			}

			// Vidarebefordra till alla andra
			wss.clients.forEach((client) => {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(data.toString());
				}
			});
		});

		ws.on('close', () => {
			const user = users.get(ws);
			users.delete(ws);

			if (user) {
				logEvent(`${user.userId} disconnected`);
				broadcast(
					JSON.stringify({
						type: 'user-left',
						userId: user.userId,
						userCount: users.size,
					})
				);
			}

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
			if (req.method === 'GET' && req.url === '/api/events') {
				res.writeHead(200, {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					Connection: 'keep-alive',
				});

				// Skicka befintlig historik
				eventLog.forEach((entry) => {
					res.write(`data: ${JSON.stringify(entry)}\n\n`);
				});

				sseClients.add(res);

				req.on('close', () => {
					sseClients.delete(res);
				});

				return;
			}

			if (req.method === 'POST' && req.url === '/api/clear') {
				logEvent('Canvas clear triggered (5s countdown)');
				// Skicka countdown-alarm
				broadcast(
					JSON.stringify({
						type: 'alarm',
						message: 'Canvas rensas om 5 sekunder...',
						severity: 'error',
					})
				);

				// Vänta 5 sek, sen rensa
				setTimeout(() => {
					broadcast(JSON.stringify({ type: 'clear-canvas' }));
				}, 5000);

				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(
					JSON.stringify({
						success: true,
						message: 'Canvas will clear in 5 seconds',
					})
				);
				return;
			}

			if (req.method === 'POST' && req.url === '/api/alarm') {
				const raw = await readBody(req);
				const body = JSON.parse(raw || '{}');
				const message = body.message || 'Alarm triggered';
				const severity = body.severity || 'info';

				logEvent(`Alarm: ${message} (${severity})`);

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
