import { migrate as logger } from "../logger.js";

const migrateName = "multiple_access_lists";

/**
 * Migrate
 *
 * @see https://knexjs.org/guide/migrations.html#migration-api
 *
 * @param   {Object} knex
 * @returns {Promise}
 */
const up = async (knex) => {
	logger.info(`[${migrateName}] Migrating Up...`);

	await knex.schema.alterTable("proxy_host", (proxy_host) => {
		proxy_host.json("access_list_ids").nullable();
		proxy_host.string("access_list_type").notNullable().defaultTo("public");
	});

	const rows = await knex("proxy_host").select("id", "access_list_id", "locations");

	for (const row of rows) {
		let access_list_ids = [];
		let access_list_type = "public";

		if (row.access_list_id && row.access_list_id !== 0) {
			access_list_ids = [row.access_list_id];
			access_list_type = "custom";
		}

		let locations;
		try {
			locations = Array.isArray(row.locations)
				? row.locations
				: JSON.parse(row.locations || "[]");
		} catch {
			locations = [];
		}

		const updateData = {
			access_list_ids: JSON.stringify(access_list_ids),
			access_list_type,
		};

		if (Array.isArray(locations) && locations.length > 0) {
			const migratedLocations = locations.map((loc) => ({
				...loc,
				accessListIds: Array.isArray(loc.accessListIds) ? loc.accessListIds : [],
				accessListType: loc.accessListType ?? "global",
			}));

			updateData.locations = JSON.stringify(migratedLocations);
		}

		await knex("proxy_host")
			.where({ id: row.id })
			.update(updateData);
	}
	logger.info(`[${migrateName}] proxy_host Table altered`);
};

/**
 * Undo Migrate
 *
 * @param   {Object} knex
 * @returns {Promise}
 */
const down = (_knex) => {
	logger.warn(`[${migrateName}] You can't migrate down this one.`);
	return Promise.resolve(true);
};

export { up, down };
