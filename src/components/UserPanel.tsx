'use client';

import { useState, useEffect } from 'react';
import { WSMessage } from '../lib/types';

interface User {
	userId: string;
	color: string;
}

interface UserPanelProps {
	subscribe: (handler: (message: WSMessage) => void) => () => void;
	currentUserId: string;
	currentUserColor: string;
}

export default function UserPanel({
	subscribe,
	currentUserId,
	currentUserColor,
}: UserPanelProps) {
	const [users, setUsers] = useState<User[]>([]);

	useEffect(() => {
		const unsubscribe = subscribe((message) => {
			if (message.type === 'user-joined') {
				setUsers((prev) => {
					if (prev.find((u) => u.userId === message.userId))
						return prev;
					return [
						...prev,
						{ userId: message.userId, color: message.color },
					];
				});
			}
			if (message.type === 'user-left') {
				setUsers((prev) =>
					prev.filter((u) => u.userId !== message.userId)
				);
			}
		});

		return unsubscribe;
	}, [subscribe]);

	return (
		<div
			style={{
				padding: '12px',
				backgroundColor: '#f8f9fa',
				borderRadius: '6px',
				marginBottom: '12px',
			}}
		>
			<strong>Connected users ({users.length + 1})</strong>
			<div
				style={{
					marginTop: '8px',
					display: 'flex',
					gap: '12px',
					flexWrap: 'wrap',
				}}
			>
				<span style={{ color: currentUserColor, fontWeight: 'bold' }}>
					● {currentUserId} (You)
				</span>
				{users.map((user) => (
					<span
						key={user.userId}
						style={{ color: user.color, fontWeight: 'bold' }}
					>
						● {user.userId}
					</span>
				))}
			</div>
		</div>
	);
}
