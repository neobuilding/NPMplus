// Objection Docs:
// http://vincit.github.io/objection.js/

import { Model } from "objection";
import db from "../db.js";
import { convertBoolFieldsToInt, convertIntFieldsToBool } from "../lib/helpers.js";
import AccessListAuth from "./access_list_auth.js";
import AccessListClient from "./access_list_client.js";
import now from "./now_helper.js";
import ProxyHostModel from "./proxy_host.js";
import User from "./user.js";

Model.knex(db());

class AccessList extends Model {
	$beforeInsert() {
	}

	$beforeUpdate() {
	}

	static get name() {
		return "ProxyHostAccessList";
	}

	static get tableName() {
		return "proxy_host_access_list";
	}

	static get jsonAttributes() {
		return ["meta"];
	}

	static get relationMappings() {
		return {
			owner: {
				relation: Model.HasManyRelation,
				modelClass: User,
				join: {
					from: "access_list.owner_user_id",
					to: "user.id",
				},
				modify: (qb) => {
					qb.where("user.is_deleted", 0);
				},
			},
			clients: {
				relation: Model.HasManyRelation,
				modelClass: AccessListClient,
				join: {
					from: "access_list.id",
					to: "access_list_client.access_list_id",
				},
			},
			proxy_hosts: {
				relation: Model.HasManyRelation,
				modelClass: ProxyHostModel,
				join: {
					from: "access_list.id",
					to: "proxy_host.access_list_id",
				},
				modify: (qb) => {
					qb.where("proxy_host.is_deleted", 0);
				},
			},
		};
	}
}

export default AccessList;
