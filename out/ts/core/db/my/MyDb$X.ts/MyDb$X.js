"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDb$X = void 0;
const tool_1 = require("../../../../tool");
const consts_1 = require("../../../consts");
const MyDb_1 = require("../MyDb");
const ProcA_1 = require("./ProcA");
const TableA_1 = require("./TableA");
const tables = [
    TableA_1.TableA,
];
const procs = [
    ProcA_1.ProcA,
];
class MyDb$X extends MyDb_1.MyDb {
    constructor(myDbs) {
        super(myDbs, consts_1.consts.$x);
    }
    initConfig(dbName) { return tool_1.env.connection; }
    async createDatabase() {
        await super.createDatabase();
        await this.sql(`use ${this.name};`);
        for (let T of tables) {
            let t = new T();
            await t.build(this);
        }
        for (let P of procs) {
            let p = new P();
            await p.build(this);
        }
    }
}
exports.MyDb$X = MyDb$X;
//# sourceMappingURL=MyDb$X.js.map