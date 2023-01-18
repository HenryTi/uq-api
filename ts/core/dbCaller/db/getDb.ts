import { Db, UqDb } from "./db";

const dbs: { [name: string]: Db } = {
}

/**
 * 
 * @param name uq(即数据库)的名称
 * @returns 返回uqDb(这是什么？) 
 */
export function getDb(name: string): Db {
    let db = dbs[name]; //.getCacheDb(name);
    if (db !== undefined) return db;
    let dbName = name; // Db.getDbName(name);
    db = new UqDb(dbName);
    return dbs[name] = db;
}

