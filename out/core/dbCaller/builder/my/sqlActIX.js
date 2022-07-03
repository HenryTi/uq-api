"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActIX = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlActIX extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IX, ID, IXs, values } = this.param;
        let sql = 'set @ret=\'\'' + mySqlBuilder_1.sqlLineEnd;
        for (let value of values) {
            let { ix, xi } = value;
            if (!xi)
                continue;
            let ixValue = { ix: undefined, xi: undefined };
            switch (typeof ix) {
                case 'undefined':
                    ixValue.ix = { value: '@user' };
                    break;
                case 'object':
                    sql += this.buildSaveIDWithoutRet(ID, ix);
                    sql += mySqlBuilder_1.retTab;
                    ixValue.ix = { value: '@id' };
                    break;
                default:
                    ixValue.ix = ix;
                    break;
            }
            switch (typeof xi) {
                case 'object':
                    sql += this.buildSaveIDWithoutRet(ID, xi);
                    sql += mySqlBuilder_1.retTab;
                    ixValue.xi = { value: '@id' };
                    break;
                default:
                    ixValue.xi = xi;
                    break;
            }
            sql += this.buildSaveIX(IX, ixValue);
            sql += this.buildIXs(IXs, ixValue);
        }
        return sql + 'select @ret as ret' + mySqlBuilder_1.sqlLineEnd;
    }
    buildIXs(IXs, ixValue) {
        if (!IXs)
            return '';
        let sql = '';
        for (let IXi of IXs) {
            let { IX, ix } = IXi;
            ixValue.ix = ix !== null && ix !== void 0 ? ix : { value: '@user' };
            sql += this.buildSaveIX(IX, ixValue);
        }
        return sql;
    }
}
exports.SqlActIX = SqlActIX;
//# sourceMappingURL=sqlActIX.js.map