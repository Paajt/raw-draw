'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Point, WSMessage } from '../lib/types';

interface CanvasProps {
	sendMessage: (message: WSMessage) => void;
	subscribe: (handler: (message: WSMessage) => void) => () => void;
	isConnected: boolean;
	userColor: string;
	userId: string;
}

export default function Canvas({
	sendMessage,
	subscribe,
	isConnected,
	userColor,
	userId,
}: CanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const isDrawing = useRef(false);
	const lastPoint = useRef<Point | null>(null);
	const pointBuffer = useRef<Point[]>([]);

	// Hjälpfunktion: rita en linje mellan två punkter
	const drawLine = useCallback(
		(
			ctx: CanvasRenderingContext2D,
			from: Point,
			to: Point,
			color: string
		) => {
			ctx.beginPath();
			ctx.moveTo(from.x, from.y);
			ctx.lineTo(to.x, to.y);
			ctx.strokeStyle = color;
			ctx.lineWidth = 3;
			ctx.lineCap = 'round';
			ctx.stroke();
		},
		[]
	);

	// Lyssna på inkommande ritdata från andra användare
	useEffect(() => {
		const unsubscribe = subscribe((message) => {
			if (message.type === 'draw') {
				const ctx = canvasRef.current?.getContext('2d');
				if (!ctx) return;

				// Rita alla punkter i meddelandet
				for (let i = 1; i < message.points.length; i++) {
					drawLine(
						ctx,
						message.points[i - 1],
						message.points[i],
						message.color
					);
				}
			}

			if (message.type === 'clear-canvas') {
				const ctx = canvasRef.current?.getContext('2d');
				if (!ctx || !canvasRef.current) return;
				ctx.clearRect(
					0,
					0,
					canvasRef.current.width,
					canvasRef.current.height
				);
			}
		});

		return unsubscribe;
	}, [subscribe, drawLine]);

	// Hämta musposition relativt till canvas
	const getMousePos = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>): Point => {
			const canvas = canvasRef.current!;
			const rect = canvas.getBoundingClientRect();
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
		},
		[]
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			isDrawing.current = true;
			const point = getMousePos(e);
			lastPoint.current = point;
			pointBuffer.current = [point];
		},
		[getMousePos]
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (!isDrawing.current) return;

			const ctx = canvasRef.current?.getContext('2d');
			if (!ctx || !lastPoint.current) return;

			const currentPoint = getMousePos(e);

			// Rita lokalt direkt (för att det ska kännas snabbt)
			drawLine(ctx, lastPoint.current, currentPoint, userColor);

			pointBuffer.current.push(currentPoint);
			lastPoint.current = currentPoint;

			// Skicka punkter var 5:e punkt (throttling)
			if (pointBuffer.current.length >= 5) {
				sendMessage({
					type: 'draw',
					points: pointBuffer.current,
					color: userColor,
					userId: userId,
				});
				// Behåll sista punkten som start för nästa batch
				pointBuffer.current = [currentPoint];
			}
		},
		[getMousePos, drawLine, userColor, userId, sendMessage]
	);

	const handleMouseUp = useCallback(() => {
		if (!isDrawing.current) return;
		isDrawing.current = false;

		// Skicka kvarvarande punkter
		if (pointBuffer.current.length > 1) {
			sendMessage({
				type: 'draw',
				points: pointBuffer.current,
				color: userColor,
				userId: userId,
			});
		}
		pointBuffer.current = [];
		lastPoint.current = null;
	}, [sendMessage, userColor, userId]);

	return (
		<div>
			<div style={{ marginBottom: '8px' }}>
				<span
					style={{
						display: 'inline-block',
						width: '12px',
						height: '12px',
						borderRadius: '50%',
						backgroundColor: isConnected ? '#2ecc71' : '#e74c3c',
						marginRight: '8px',
					}}
				/>
				{isConnected ? 'Connected' : 'Disconnected'}
				<span
					style={{
						marginLeft: '16px',
						color: userColor,
						fontWeight: 'bold',
					}}
				>
					● Your color
				</span>
			</div>
			<canvas
				ref={canvasRef}
				width={800}
				height={600}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				style={{
					border: '2px solid #333',
					borderRadius: '4px',
					cursor: 'crosshair',
					backgroundColor: '#fff',
				}}
			/>
		</div>
	);
}
