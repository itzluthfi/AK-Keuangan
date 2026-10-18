import { db } from '#lib/server/db';
import { projects, projectVendors } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allProjects = await db.select().from(projects).orderBy(projects.nama).all();
	const allVendors = await db.select().from(projectVendors).all();

	return {
		projects: allProjects,
		vendors: allVendors
	};
};
