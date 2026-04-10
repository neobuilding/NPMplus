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

export default {
    getAccessListRelationRows,
    syncAccessListRelations

};