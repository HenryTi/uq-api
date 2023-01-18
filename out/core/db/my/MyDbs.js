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
const MyDb_Unitx_1 = require("./MyDb$Unitx");
const MyDb_Uq_1 = require("./MyDb$Uq");
const MyDbNoName_1 = require("./MyDbNoName");
const MyDbUq_1 = require("./MyDbUq");
class MyDbs {
    constructor() {
        this.db$Uq = new MyDb_Uq_1.MyDb$Uq();
        this.db$Res = new MyDb_Res_1.MyDb$Res();
        this.db$UnitxTest = new MyDb_Unitx_1.MyDb$UnitxTest();
        this.db$UnitxProd = new MyDb_Unitx_1.MyDb$UnitxProd();
        this.dbNoName = new MyDbNoName_1.MyDbNoName();
        this.dbUqs = {};
    }
    getDbUq(uqName) {
        let dbUq = this.dbUqs[uqName];
        if (dbUq === undefined) {
            dbUq = new MyDbUq_1.MyDbUq(uqName);
            this.dbUqs[uqName] = dbUq;
        }
        return dbUq;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            // create$ResDb(),
            // create$UqDb()
            yield Promise.all([
                this.db$Uq.createDatabase(),
                this.db$Res.createDatabase(),
            ]);
        });
    }
}
exports.MyDbs = MyDbs;
//# sourceMappingURL=MyDbs.js.map