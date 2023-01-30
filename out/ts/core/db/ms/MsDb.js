"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsDb = void 0;
class MsDb {
    constructor(dbName, dbConfig) {
        this.name = dbName;
    }
    sql(sql, params) {
        throw new Error('Method not implemented.');
    }
    proc(proc, params) {
        throw new Error('Method not implemented.');
    }
    buildDatabase() {
        throw new Error('Method not implemented.');
    }
    existsDatabase() {
        throw new Error('Method not implemented.');
    }
    createDatabase() {
        throw new Error('Method not implemented.');
    }
    // protected createBuilder() { return new MsBuilder(this.dbName, this.hasUnit, this.twProfix); }
    get twProfix() { return; }
    loadTwProfix() { return; }
}
exports.MsDb = MsDb;
//# sourceMappingURL=MsDb.js.map