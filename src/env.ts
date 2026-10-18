import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'The database connection string.',
		schema: (value) => value ?? './data/pantau_mbg.db'
	}
});
