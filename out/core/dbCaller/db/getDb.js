"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = void 0;
const db_1 = require("./db");
const dbs = {};
/**
 *
 * @param name uq(即数据库)的名称
 * @returns 返回uqDb(这是什么？)
 */
function getDb(name) {
    let db = dbs[name]; //.getCacheDb(name);
    if (db !== undefined)
        return db;
    let dbName = name; // Db.getDbName(name);
    db = new db_1.UqDb(dbName);
    return dbs[name] = db;
}
exports.getDb = getDb;
//# sourceMappingURL=getDb.js.map