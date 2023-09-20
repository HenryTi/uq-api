"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDbs = void 0;
const MyDb_Res_1 = require("./MyDb$Res");
const MyDb_Site_1 = require("./MyDb$Site");
const MyDb_Unitx_1 = require("./MyDb$Unitx");
const MyDb_Uq_1 = require("./MyDb$Uq");
const MyDbNoName_1 = require("./MyDbNoName");
const MyDbUq_1 = require("./MyDbUq");
class MyDbs {
    constructor(uq_api_version) {
        this.uq_api_version = uq_api_version;
        this.db$Uq = new MyDb_Uq_1.MyDb$Uq(this);
        this.db$Res = new MyDb_Res_1.MyDb$Res(this);
        this.db$Site = new MyDb_Site_1.MyDb$Site(this);
        this.db$UnitxTest = new MyDb_Unitx_1.MyDb$Unitx(this, true);
        this.db$UnitxProd = new MyDb_Unitx_1.MyDb$Unitx(this, false);
        this.dbNoName = new MyDbNoName_1.MyDbNoName(this);
        this.dbUqs = {};
    }
    async getDbUq(dbName) {
        let dbUq = this.dbUqs[dbName];
        if (dbUq === undefined) {
            dbUq = new MyDbUq_1.MyDbUq(this, dbName);
            this.dbUqs[dbName] = dbUq;
            await dbUq.initLoad();
        }
        return dbUq;
    }
    async start() {
        const [sqlsVersion, savedUqApiVersion] = await this.dbNoName.versions();
        this.sqlsVersion = sqlsVersion;
        if (savedUqApiVersion !== this.uq_api_version) {
            await Promise.all([
                this.db$Uq.createDatabase(),
                this.db$Res.createDatabase(),
                this.db$Site.createDatabase(),
            ]);
            await this.dbNoName.saveUqVersion();
        }
    }
}
exports.MyDbs = MyDbs;
//# sourceMappingURL=MyDbs.js.map