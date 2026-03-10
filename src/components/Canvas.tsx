'use client';

import { useRef, useEffect, useCallback } from 'react';
import { WSMessage, Point } from '@/src/lib/types';

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
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const isDrawing = useRef(false);
	const lastPoint = useRef<Point | null>(null);
	const pointBuffer = useRef<Point[]>([]);

	// Gör canvas responsiv
	useEffect(() => {
		function resize() {
			const canvas = canvasRef.current;
			const container = containerRef.current;
			if (!canvas || !container) return;

			canvas.width = container.clientWidth;
			canvas.height = Math.max(400, window.innerHeight - 250);
		}

		resize();
		window.addEventListener('resize', resize);
		return () => window.removeEventListener('resize', resize);
	}, []);

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
			ctx.lineJoin = 'round';
			ctx.stroke();
		},
		[]
	);

	useEffect(() => {
		const unsubscribe = subscribe((message) => {
			if (message.type === 'draw') {
				const ctx = canvasRef.current?.getContext('2d');
				if (!ctx) return;
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
				const canvas = canvasRef.current;
				const ctx = canvas?.getContext('2d');
				if (!ctx || !canvas) return;
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
		});
		return unsubscribe;
	}, [subscribe, drawLine]);

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
			drawLine(ctx, lastPoint.current, currentPoint, userColor);
			pointBuffer.current.push(currentPoint);
			lastPoint.current = currentPoint;

			if (pointBuffer.current.length >= 5) {
				sendMessage({
					type: 'draw',
					points: pointBuffer.current,
					color: userColor,
					userId: userId,
				});
				pointBuffer.current = [currentPoint];
			}
		},
		[getMousePos, drawLine, userColor, userId, sendMessage]
	);

	const handleMouseUp = useCallback(() => {
		if (!isDrawing.current) return;
		isDrawing.current = false;

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
		<div ref={containerRef}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: '8px',
					fontSize: '12px',
					color: 'var(--text-muted)',
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '6px',
					}}
				>
					<div
						style={{
							width: '6px',
							height: '6px',
							borderRadius: '50%',
							backgroundColor: isConnected
								? '#22c55e'
								: '#ef4444',
						}}
					/>
					{isConnected ? 'Connected' : 'Disconnected'}
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '6px',
					}}
				>
					<div
						style={{
							width: '12px',
							height: '12px',
							borderRadius: '3px',
							backgroundColor: userColor,
						}}
					/>
					Your color
				</div>
			</div>
			<canvas
				ref={canvasRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				style={{
					width: '100%',
					border: '2px solid black',
					borderRadius: '8px',
					cursor: 'crosshair',
					backgroundColor: 'var(--surface)',
				}}
			/>
		</div>
	);
}
