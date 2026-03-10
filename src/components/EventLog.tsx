'use client';

import { useState, useEffect, useRef } from 'react';

interface LogEntry {
	time: string;
	event: string;
}

export default function EventLog() {
	const [entries, setEntries] = useState<LogEntry[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		const eventSource = new EventSource('/api/events');

		eventSource.onmessage = (e) => {
			const entry = JSON.parse(e.data) as LogEntry;
			setEntries((prev) => [...prev, entry]);
		};

		return () => {
			eventSource.close();
		};
	}, [isOpen]);

	// Auto-scroll till botten
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [entries]);

	return (
		<div style={{ marginTop: '16px' }}>
			<button
				onClick={() => {
					if (!isOpen) setEntries([]); // Rensa
					setIsOpen(!isOpen);
				}}
				style={{
					background: 'none',
					border: '1px solid var(--border)',
					borderRadius: '6px',
					padding: '6px 12px',
					fontSize: '12px',
					color: 'var(--text-muted)',
					cursor: 'pointer',
					width: '100%',
					textAlign: 'left',
				}}
			>
				{isOpen ? '▼' : '▶'} Event Log (SSE){' '}
				{!isOpen && '— click to open'}
			</button>
			{isOpen && (
				<div
					ref={scrollRef}
					style={{
						marginTop: '8px',
						padding: '12px',
						backgroundColor: '#1a1a1a',
						color: '#22c55e',
						fontFamily: 'monospace',
						fontSize: '11px',
						borderRadius: '6px',
						height: '200px',
						overflowY: 'auto',
						lineHeight: '1.6',
					}}
				>
					{entries.length === 0 && (
						<span style={{ color: '#666' }}>
							Waiting for events...
						</span>
					)}
					{entries.map((entry, i) => {
						const time = new Date(entry.time).toLocaleTimeString();
						return (
							<div key={i}>
								<span style={{ color: '#666' }}>[{time}]</span>{' '}
								{entry.event}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
