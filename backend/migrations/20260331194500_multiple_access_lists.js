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
	return knex.transaction(async (trx) => {
		logger.info(`[${migrateName}] Migrating Up...`);

		await trx.schema.alterTable("proxy_host", (proxy_host) => {
			proxy_host.json("access_list_ids").nullable();
			proxy_host.string("access_list_type").notNullable().defaultTo("public");
		});
		await trx.schema.createTable("proxy_host_access_list", (table) => {
			table.integer("proxy_host_id").unsigned().notNullable();
			table.integer("access_list_id").unsigned().notNullable();
			table.primary(["proxy_host_id", "access_list_id"]);
			table.foreign("proxy_host_id").references("proxy_host.id").onDelete("CASCADE");
			table.foreign("access_list_id").references("access_list.id").onDelete("CASCADE");
		});

		const rows = await trx("proxy_host").select("id", "access_list_id", "locations");

		for (const row of rows) {
			let access_list_ids = [];
			let access_list_type = "public";
			let acl_hosts = {};

			// 0 was used for public but now its no longer used for that
			// so ignore 0
			if (row.access_list_id && row.access_list_id !== 0) {
				access_list_ids = [row.access_list_id];
				access_list_type = "custom";
				acl_hosts[row.id + "_" + row.access_list_id] = {
					proxy_host_id: row.id,
					access_list_id: row.access_list_id,
				};
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
				let count = 0;
				migratedLocations.forEach(location => {
					location.id = count++;
					if (Array.isArray(location.accessListIds)) {
						location.accessListIds.forEach(aclId => {
							acl_hosts[row.id + "_" + aclId] = {
								proxy_host_id: row.id,
								access_list_id: aclId,
							};
						});
					}
				});
				updateData.locations = JSON.stringify(migratedLocations);
			}

			await trx("proxy_host")
				.where({ id: row.id })
				.update(updateData);
			const acl_host_rows = Object.values(acl_hosts);
			if (acl_host_rows.length > 0) {
				await trx("proxy_host_access_list")
					.insert(acl_host_rows);
			}
		}
		
		logger.info(`[${migrateName}] proxy_host Table altered`);
	});
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
