'use client';

import { useState, useEffect, useRef } from 'react';
import { WSMessage } from '@/src/lib/types';

interface Alarm {
	id: number;
	message: string;
	severity: 'info' | 'warning' | 'error';
	countdown?: number;
}

interface AlarmBannerProps {
	subscribe: (handler: (message: WSMessage) => void) => () => void;
}

export default function AlarmBanner({ subscribe }: AlarmBannerProps) {
	const [alarms, setAlarms] = useState<Alarm[]>([]);
	const intervalsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

	useEffect(() => {
		const unsubscribe = subscribe((message) => {
			if (message.type === 'alarm') {
				const newAlarm: Alarm = {
					id: Date.now(),
					message: message.message,
					severity: message.severity,
					countdown: message.message.includes('5 sekunder')
						? 5
						: undefined,
				};
				setAlarms((prev) => [...prev, newAlarm]);

				if (newAlarm.countdown) {
					// Starta countdown
					const interval = setInterval(() => {
						setAlarms((prev) =>
							prev.map((a) => {
								if (a.id !== newAlarm.id || !a.countdown)
									return a;
								const next = a.countdown - 1;
								if (next <= 0) {
									clearInterval(
										intervalsRef.current.get(a.id)!
									);
									intervalsRef.current.delete(a.id);
									return {
										...a,
										countdown: 0,
										message: 'Canvas rensas nu!',
									};
								}
								return {
									...a,
									countdown: next,
									message: `Canvas rensas om ${next} sekunder...`,
								};
							})
						);
					}, 1000);
					intervalsRef.current.set(newAlarm.id, interval);

					// Ta bort alarmet efter 6 sekunder (1 sek efter clear)
					setTimeout(() => {
						setAlarms((prev) =>
							prev.filter((a) => a.id !== newAlarm.id)
						);
					}, 6000);
				} else {
					setTimeout(() => {
						setAlarms((prev) =>
							prev.filter((a) => a.id !== newAlarm.id)
						);
					}, 5000);
				}
			}
		});

		return () => {
			unsubscribe();
			intervalsRef.current.forEach((interval) => clearInterval(interval));
		};
	}, [subscribe]);

	if (alarms.length === 0) return null;

	const severityStyles = {
		info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
		warning: {
			bg: '#fffbeb',
			border: '#fde68a',
			text: '#92400e',
		},
		error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
	};

	return (
		<div
			style={{
				position: 'fixed',
				top: '20px',
				right: '20px',
				zIndex: 1000,
				display: 'flex',
				flexDirection: 'column',
				gap: '8px',
				maxWidth: '360px',
			}}
		>
			{alarms.map((alarm) => {
				const style = severityStyles[alarm.severity];
				return (
					<div
						key={alarm.id}
						style={{
							padding: '12px 16px',
							backgroundColor: style.bg,
							border: `1px solid ${style.border}`,
							color: style.text,
							borderRadius: '8px',
							fontSize: '13px',
							fontWeight: 500,
							boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
							animation: 'slideIn 0.3s ease-out',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						{alarm.message}
					</div>
				);
			})}
		</div>
	);
}
