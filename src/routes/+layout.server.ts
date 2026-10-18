import type { LayoutServerLoad } from './$types';
import { db } from '#lib/server/db';
import { projects, masterVendors } from '#lib/server/db/schema';

export const load: LayoutServerLoad = async ({ locals }) => {
	const searchProjects = await db
		.select({
			id: projects.id,
			nama: projects.nama,
			kode: projects.kode,
			lokasi: projects.lokasi,
			status: projects.status
		})
		.from(projects)
		.all();

	const searchVendors = await db
		.select({
			id: masterVendors.id,
			nama: masterVendors.nama,
			bidang: masterVendors.bidang
		})
		.from(masterVendors)
		.all();

	return {
		user: locals.user ?? null,
		searchData: {
			projects: searchProjects,
			vendors: searchVendors
		}
	};
};

