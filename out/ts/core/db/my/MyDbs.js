"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDbs = void 0;
const MyDb_Res_1 = require("./MyDb$Res");
const MyDb_Site_1 = require("./MyDb$Site");
const MyDb_Unitx_1 = require("./MyDb$Unitx");
const MyDb_Uq_1 = require("./MyDb$Uq");
const MyDbNoName_1 = require("./MyDbNoName");
const MyDbUq_1 = require("./MyDbUq");
const dbBizName = 'jksoft_mini_jxc_trial';
class MyDbs {
    constructor(uq_api_version) {
        this.uq_api_version = uq_api_version;
        this.db$Uq = new MyDb_Uq_1.MyDb$Uq(this);
        this.db$Res = new MyDb_Res_1.MyDb$Res(this);
        this.db$Site = new MyDb_Site_1.MyDb$Site(this, undefined);
        this.db$UnitxTest = new MyDb_Unitx_1.MyDb$Unitx(this, true);
        this.db$UnitxProd = new MyDb_Unitx_1.MyDb$Unitx(this, false);
        this.dbNoName = new MyDbNoName_1.MyDbNoName(this);
        this.dbBiz = new MyDbUq_1.MyDbUq(this, dbBizName);
        this.dbUqs = {};
        this.dbUqs[dbBizName] = this.dbBiz;
    }
    createSiteDb(siteId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dbSite = new MyDb_Site_1.MyDb$Site(this, siteId);
            yield dbSite.createDatabase();
            // return new MyDb$Site(this, siteId);
        });
    }
    getDbUq(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let dbUq = this.dbUqs[dbName];
            if (dbUq === undefined) {
                dbUq = new MyDbUq_1.MyDbUq(this, dbName);
                this.dbUqs[dbName] = dbUq;
                yield dbUq.initLoad();
            }
            return dbUq;
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const [sqlsVersion, savedUqApiVersion] = yield this.dbNoName.versions();
            this.sqlsVersion = sqlsVersion;
            if (savedUqApiVersion !== this.uq_api_version) {
                yield Promise.all([
                    this.db$Uq.createDatabase(),
                    this.db$Res.createDatabase(),
                    this.db$Site.createDatabase(),
                ]);
                yield this.dbNoName.saveUqVersion();
            }
            yield this.dbBiz.initLoad();
        });
    }
}
exports.MyDbs = MyDbs;
//# sourceMappingURL=MyDbs.js.map