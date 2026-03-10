'use client';

import { useState, useEffect } from 'react';
import { WSMessage } from '@/src/lib/types';

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
					if (message.userId === currentUserId) return prev; // ← Ignorera sig själv
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
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				padding: '8px 12px',
				backgroundColor: 'var(--surface)',
				border: '1px solid var(--border)',
				borderRadius: '8px',
				marginBottom: '12px',
				fontSize: '12px',
				flexWrap: 'wrap',
			}}
		>
			<span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
				{users.length + 1} online
			</span>
			<div
				style={{
					width: '1px',
					height: '16px',
					backgroundColor: 'var(--border)',
				}}
			/>
			<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
					}}
				>
					<div
						style={{
							width: '8px',
							height: '8px',
							borderRadius: '50%',
							backgroundColor: currentUserColor,
						}}
					/>
					<span style={{ fontWeight: 500 }}>{currentUserId}</span>
					<span
						style={{ color: 'var(--text-muted)', fontSize: '11px' }}
					>
						(you)
					</span>
				</div>
				{users.map((user) => (
					<div
						key={user.userId}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '4px',
						}}
					>
						<div
							style={{
								width: '8px',
								height: '8px',
								borderRadius: '50%',
								backgroundColor: user.color,
							}}
						/>
						<span style={{ fontWeight: 500 }}>{user.userId}</span>
					</div>
				))}
			</div>
		</div>
	);
}
