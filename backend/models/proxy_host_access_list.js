// Objection Docs:
// http://vincit.github.io/objection.js/

import { Model } from "objection";
import db from "../db.js";
import ProxyHostModel from "./proxy_host.js";
import AccessList from "./access_list.js";

Model.knex(db());

class ProxyHostAccessList extends Model {

	static get name() {
		return "ProxyHostAccessList";
	}

	static get tableName() {
		return "proxy_host_access_list";
	}

	static get relationMappings() {
		return {
			access_list: {
				relation: Model.BelongsToOneRelation,
				modelClass: AccessList,
				join: {
					from: "proxy_host_access_list.access_list_id",
					to: "access_list.id",
				},
				modify: (qb) => {
					qb.where("access_list.is_deleted", 0);
				},
			},
			proxy_host: {
				relation: Model.BelongsToOneRelation,
				modelClass: ProxyHostModel,
				join: {
					from: "proxy_host_access_list.proxy_host_id",
					to: "proxy_host.id",
				},
				modify: (qb) => {
					qb.where("proxy_host.is_deleted", 0);
				},
			},
		};
	}
}

export default ProxyHostAccessList;
