"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDbs = void 0;
const MyDb_Res_1 = require("./MyDb$Res");
const MyDb_Unitx_1 = require("./MyDb$Unitx");
const MyDb_Uq_1 = require("./MyDb$Uq");
const MyDbNoName_1 = require("./MyDbNoName");
const MyDbUq_1 = require("./MyDbUq");
const sqlsVersion_1 = require("./sqlsVersion");
class MyDbs {
    constructor() {
        this.db$Uq = new MyDb_Uq_1.MyDb$Uq();
        this.db$Res = new MyDb_Res_1.MyDb$Res();
        this.db$UnitxTest = new MyDb_Unitx_1.MyDb$Unitx(true);
        this.db$UnitxProd = new MyDb_Unitx_1.MyDb$Unitx(false);
        this.dbNoName = new MyDbNoName_1.MyDbNoName();
        this.dbUqs = {};
    }
    async getDbUq(uqName) {
        let dbUq = this.dbUqs[uqName];
        if (dbUq === undefined) {
            dbUq = new MyDbUq_1.MyDbUq(uqName);
            this.dbUqs[uqName] = dbUq;
            await dbUq.initLoad();
        }
        return dbUq;
    }
    async start() {
        // create$ResDb(),
        // create$UqDb()
        await Promise.all([
            (0, sqlsVersion_1.checkSqlVersion)(),
            this.db$Uq.createDatabase(),
            this.db$Res.createDatabase(),
        ]);
    }
}
exports.MyDbs = MyDbs;
//# sourceMappingURL=MyDbs.js.map