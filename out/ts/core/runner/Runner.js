"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
const centerApi_1 = require("../centerApi");
// import { DbContainer } from '../db';
class Runner {
    constructor(dbUq) {
        this.dbUq = dbUq;
    }
    // protected readonly dbContainer: DbContainer;
    /*
    constructor(db: DbContainer) {
        this.dbContainer = db;
    }
    */
    // getDb(): string { return this.db.getDbName() }
    async syncCenterUser(userId) {
        let user = await centerApi_1.centerApi.userFromId(userId);
        let { id, name, nick, icon } = user;
        await this.dbUq.call('$set_user', [id, name, nick, icon]);
        return user;
    }
    async procCall(proc, params) {
        return await this.dbUq.call(proc, params);
    }
}
exports.Runner = Runner;
//# sourceMappingURL=Runner.js.map