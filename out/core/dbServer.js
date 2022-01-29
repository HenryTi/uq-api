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
exports.DbServer = void 0;
class DbServer {
    constructor(dbName) {
        this.dbName = dbName;
        //this.builder = this.createBuilder();
    }
    setBuilder() { this.builder = this.createBuilder(); }
    execSql(unit, user, sql) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
            return ret;
        });
    }
    execSqlTrans(unit, user, sql) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.call(this.dbName, 'tv_$exec_sql_trans', [unit, user, sql]);
            return ret;
        });
    }
    Acts(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.Acts(param).build();
            if (param.$sql === true)
                return sql;
            let ret = yield this.execSqlTrans(unit, user, sql);
            return ret;
        });
    }
    ActIX(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.ActIX(param).build();
            if (param.$sql === true)
                return sql;
            let ret = yield this.execSqlTrans(unit, user, sql);
            return ret;
        });
    }
    ActIXSort(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.ActIXSort(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSqlTrans(unit, user, sql);
        });
    }
    ActIDProp(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let { ID, name, value } = param;
            yield this.call(this.dbName, `tv_${ID}$prop`, [unit, user, name, value]);
        });
    }
    ActDetail(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.ActDetail(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSqlTrans(unit, user, sql);
        });
    }
    QueryID(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.QueryID(param).build();
            if (param.$sql === true)
                return sql;
            let ret = yield this.execSql(unit, user, sql);
            return ret;
        });
    }
    IDNO(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDNO(param).build();
            if (param.$sql === true)
                return sql;
            let ret = yield this.execSql(unit, user, sql);
            return ret[0]['no'];
        });
    }
    IDDetailGet(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDDetailGet(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    ID(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.ID(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    IDTv(unit, user, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDTv(ids).build();
            if (ids.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    KeyID(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyID(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    IX(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IX(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    IXr(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IXr(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    KeyIX(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyIX(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    IDLog(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDLog(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    IDSum(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDSum(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    KeyIDSum(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyIDSum(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    IXSum(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IXSum(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    KeyIXSum(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyIXSum(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    IDinIX(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDinIX(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    IDxID(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDxID(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
    IDTree(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDTree(param).build();
            if (param.$sql === true)
                return sql;
            return yield this.execSql(unit, user, sql);
        });
    }
}
exports.DbServer = DbServer;
//# sourceMappingURL=dbServer.js.map