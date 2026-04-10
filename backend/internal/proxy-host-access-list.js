import { appendFile, rm, writeFile } from "node:fs/promises";
import { access as logger } from "../logger.js";

const GENERATED_DIR = "/data/access";

/**
 * 
 * @param {*} proxyHostId 
 * @param {*} data 
 * @returns 
 */
const getAccessListRelationRows = (proxyHostId, data) => {
    const relationIds = new Set();

    // perform data sanitisation
    if (data.access_list_type === "custom" && Array.isArray(data.access_list_ids)) {
        data.access_list_ids.forEach((id) => {
            if (Number.isInteger(id)) {
                relationIds.add(id);
            }
        });
    }

    // since locations is stored as a json, extract it and flatten it to store in the join table
    if (Array.isArray(data.locations)) {
        data.locations.forEach((location) => {
            if (location.accessListType === "custom" && Array.isArray(location.accessListIds)) {
                location.accessListIds.forEach((id) => {
                    if (Number.isInteger(id)) {
                        relationIds.add(id);
                    }
                });
            }
        });
    }
    // now map the acls to proxy hosts
    return Array.from(relationIds).map((access_list_id) => ({
        proxy_host_id: proxyHostId,
        access_list_id,
    }));
};

/**
 * 
 * @param {*} trx 
 * @param {*} proxyHostId 
 * @param {*} data 
 */
const syncAccessListRelations = async (trx, proxyHostId, data) => {
    const desiredRows = getAccessListRelationRows(proxyHostId, data);
    const desiredIds = new Set(desiredRows.map((row) => row.access_list_id));

    const existingRows = await trx("proxy_host_access_list")
        .where("proxy_host_id", proxyHostId)
        .select("access_list_id");

    const existingIds = new Set(existingRows.map((row) => row.access_list_id));

    const idsToInsert = [...desiredIds].filter((id) => !existingIds.has(id));
    const idsToDelete = [...existingIds].filter((id) => !desiredIds.has(id));

    if (idsToInsert.length > 0) {
        await trx("proxy_host_access_list").insert(
            idsToInsert.map((access_list_id) => ({
                proxy_host_id: proxyHostId,
                access_list_id,
            })),
        );
    }

    if (idsToDelete.length > 0) {
        await trx("proxy_host_access_list")
            .where("proxy_host_id", proxyHostId)
            .whereIn("access_list_id", idsToDelete)
            .delete();
    }
};


const getMergedItems = (accessLists) => {
    const seen = new Set();
    const merged = [];

    for (const accessList of accessLists || []) {
        for (const item of accessList.items || []) {
            if (item.username && item.password && !seen.has(item.username)) {
                seen.add(item.username);
                merged.push(item);
            }
        }
    }
    return merged;
};

/**
    * 
    * @param {*} proxyHost 
    * @returns 
    */
const getHostFilename = (proxyHost) => {
    return `${GENERATED_DIR}/host-${proxyHost.id}`;
};

/**
 * 
 * @param {*} proxyHost 
 * @param {*} location 
 * @returns 
 */
const getLocationFilename = (proxyHost, location) => {
    return `${GENERATED_DIR}/host-${proxyHost.id}-location-${location.id}`;
};

const writeHtpasswdFile = async (filename, items, label) => {
    logger.info(`Building multi Access file ${filename} for: ${label}`);

    await rm(filename, { force: true });
    await writeFile(filename, "", { encoding: "utf8" });

    for (const item of items || []) {
        await appendFile(filename, `${item.username}:${item.password}\n`, {
            encoding: "utf8",
        });
    }

    logger.success(`Built merged Access file ${filename} for: ${label}`);
};

const build = (list) => {
    const lists = list || [];
    const first = lists[0] || null; // satisfy any or pass auth need to be specified in the first acl
    return {
        items: getMergedItems(lists),
        clients: lists.flatMap((list) => list.clients || []),
        satisfy_any: first ? !!first.satisfy_any : false,
        pass_auth: first ? !!first.pass_auth : false,
        source_acl_ids: lists.map((list) => list.id).filter((id) => Number.isInteger(id)),
    };
};

export default {
    getAccessListRelationRows,
    syncAccessListRelations,

    /**
     * 
     * @param {*} proxyHost 
     * @param {*} accessLists 
     * @returns 
     */
    buildHostFile: async (proxyHost, accessLists) => {
        const effectiveAccess = build(accessLists);
        const filename = getHostFilename(proxyHost);

        if (!effectiveAccess.items.length) {
            await rm(filename, { force: true });
            return effectiveAccess;
        }
        await writeHtpasswdFile(filename, effectiveAccess.items, `proxy host #${proxyHost.id}`);
        return effectiveAccess;
    },

    /**
     * 
     * @param {*} proxyHost 
     * @param {*} location 
     * @param {*} accessLists 
     * @returns 
     */
    buildLocationFile: async (proxyHost, location, accessLists) => {
        const effectiveAccess = build(accessLists);
        const filename = getLocationFilename(proxyHost, location);

        if (!effectiveAccess.items.length) {
            await rm(filename, { force: true });
            return effectiveAccess;
        }
        await writeHtpasswdFile(filename, effectiveAccess.items, `proxy host #${proxyHost.id} location #${location.id}`);
        return effectiveAccess;
    }
};