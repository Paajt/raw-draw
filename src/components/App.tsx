'use client';

import { useState } from 'react';
import { useWebSocket } from '@/src/lib/useWebSocket';
import Canvas from './Canvas';
import AlarmBanner from './AlarmBanner';
import UserPanel from './UserPanel';
import EventLog from './EventLog';

export default function App() {
	const { sendMessage, subscribe, isConnected } = useWebSocket();
	const [userColor] = useState(() => {
		const colors = [
			'#e74c3c',
			'#3498db',
			'#2ecc71',
			'#f39c12',
			'#9b59b6',
			'#1abc9c',
		];
		return colors[Math.floor(Math.random() * colors.length)];
	});
	const [userId] = useState(() => Math.random().toString(36).substring(2, 8));

	return (
		<>
			<UserPanel
				subscribe={subscribe}
				currentUserId={userId}
				currentUserColor={userColor}
			/>
			<Canvas
				sendMessage={sendMessage}
				subscribe={subscribe}
				isConnected={isConnected}
				userColor={userColor}
				userId={userId}
			/>
			<AlarmBanner subscribe={subscribe} />
			<EventLog />
		</>
	);
}
