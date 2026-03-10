'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { WSMessage } from './types';

export function useWebSocket() {
	const wsRef = useRef<WebSocket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		// Bygg WebSocket-URL baserat på nuvarande adress
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/ws`;

		const ws = new WebSocket(wsUrl);
		wsRef.current = ws;

		ws.onopen = () => {
			console.log('WebSocket connected');
			setIsConnected(true);
		};

		ws.onclose = () => {
			console.log('WebSocket disconnected');
			setIsConnected(false);
		};

		// Cleanup vid unmount
		return () => {
			ws.close();
		};
	}, []);

	// Funktion för att skicka meddelanden
	const sendMessage = useCallback((message: WSMessage) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(message));
		}
	}, []);

	// Funktion för att lyssna på meddelanden
	const onMessage = useCallback((handler: (message: WSMessage) => void) => {
		if (wsRef.current) {
			wsRef.current.onmessage = (event) => {
				const message = JSON.parse(event.data) as WSMessage;
				handler(message);
			};
		}
	}, []);

	return { sendMessage, onMessage, isConnected };
}
