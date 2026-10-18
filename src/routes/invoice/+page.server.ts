import { db } from '#lib/server/db';
import { projects, projectVendors, projectTermins, masterAccounts } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allProjects = await db.select().from(projects).orderBy(projects.nama).all();
	const allVendors = await db.select().from(projectVendors).all();
	const allTermins = await db.select().from(projectTermins).all();
	const accounts = await db.select().from(masterAccounts).all();

	return {
		projects: allProjects,
		vendors: allVendors,
		termins: allTermins,
		accounts
	};
};
