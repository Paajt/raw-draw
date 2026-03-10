'use client';

import { WSMessage } from '../lib/types';
import { useState, useEffect } from 'react';

interface Alarm {
	id: number;
	message: string;
	severity: 'info' | 'warning' | 'error';
}

interface AlarmBannerProps {
	subscribe: (handler: (message: WSMessage) => void) => () => void;
}

export default function AlarmBanner({ subscribe }: AlarmBannerProps) {
	const [alarms, setAlarms] = useState<Alarm[]>([]);

	useEffect(() => {
		const unsubscribe = subscribe((message) => {
			if (message.type === 'alarm') {
				const newAlarm: Alarm = {
					id: Date.now(),
					message: message.message,
					severity: message.severity,
				};
				setAlarms((prev) => [...prev, newAlarm]);

				// Ta bort alarmet efter 5 sekunder
				setTimeout(() => {
					setAlarms((prev) =>
						prev.filter((a) => a.id !== newAlarm.id)
					);
				}, 5000);
			}
		});

		return unsubscribe;
	}, [subscribe]);

	if (alarms.length === 0) return null;

	const severityColors = {
		info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
		warning: { bg: '#fff3cd', border: '#ffeeba', text: '#856404' },
		error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
	};

	return (
		<div
			style={{
				position: 'fixed',
				top: '16px',
				right: '16px',
				zIndex: 1000,
			}}
		>
			{alarms.map((alarm) => {
				const colors = severityColors[alarm.severity];
				return (
					<div
						key={alarm.id}
						style={{
							padding: '12px 20px',
							marginBottom: '8px',
							backgroundColor: colors.bg,
							border: `1px solid ${colors.border}`,
							color: colors.text,
							borderRadius: '6px',
							fontWeight: 'bold',
							boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
							animation: 'slideIn 0.3s ease-out',
						}}
					>
						{alarm.severity === 'warning' && '⚠️ '}
						{alarm.severity === 'error' && '🚨 '}
						{alarm.severity === 'info' && 'ℹ️ '}
						{alarm.message}
					</div>
				);
			})}
		</div>
	);
}
