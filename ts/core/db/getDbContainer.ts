
/*
import { DbContainer } from "./DbContainer";
import { UqDbContainer } from "./UqDbContainer";

const dbs: { [name: string]: DbContainer } = {
}

export function getDbContainer(name: string): DbContainer {
    let db = dbs[name]; //.getCacheDb(name);
    if (db !== undefined) return db;
    let dbName = name; // Db.getDbName(name);
    db = new UqDbContainer(dbName);
    return dbs[name] = db;
}

*/