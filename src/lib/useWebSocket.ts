'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { WSMessage } from './types';

type MessageHandler = (message: WSMessage) => void;

export function useWebSocket() {
	const handlersRef = useRef<Set<MessageHandler>>(new Set());
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

		ws.onmessage = (event) => {
			const message = JSON.parse(event.data) as WSMessage;
			// Anropa ALLA registrerade handlers
			handlersRef.current.forEach((handler) => handler(message));
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

	// Registrera en lyssnare — returnerar en cleanup-funktion
	const subscribe = useCallback((handler: MessageHandler) => {
		handlersRef.current.add(handler);
		return () => {
			handlersRef.current.delete(handler);
		};
	}, []);

	return { sendMessage, subscribe, isConnected };
}
