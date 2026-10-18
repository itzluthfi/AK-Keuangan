import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sqlite } from '#lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		// Verifikasi konektivitas database SQLite
		const ping = sqlite.prepare('SELECT 1 as alive').get() as { alive: number } | undefined;
		const isDbAlive = ping?.alive === 1;

		if (!isDbAlive) {
			return json(
				{
					status: 'degraded',
					db: 'disconnected',
					uptime: process.uptime(),
					timestamp: new Date().toISOString()
				},
				{ status: 503 }
			);
		}

		return json({
			status: 'ok',
			db: 'connected',
			app: 'Pantau MBG SPPG',
			uptime: Math.floor(process.uptime()),
			timestamp: new Date().toISOString()
		});
	} catch (error: any) {
		return json(
			{
				status: 'error',
				error: error?.message || 'Health check failed',
				uptime: process.uptime(),
				timestamp: new Date().toISOString()
			},
			{ status: 503 }
		);
	}
};
