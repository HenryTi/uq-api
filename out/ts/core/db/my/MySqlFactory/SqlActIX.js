"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActIX = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlActIX extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { IX, ID: ID, IXs, values } = p;
        let ret = Object.assign({}, p);
        ret.IX = this.getTableSchema(IX, ['ix']);
        ret.ID = this.getTableSchema(ID, ['id']);
        if (IXs) {
            ret.IXs = IXs.map(v => {
                let { IX, ix } = v;
                return { IX: this.getTableSchema(IX, ['ix']), ix };
            });
        }
        if (values) {
            ret.values = values.map(v => this.buildValueTableSchema(v));
        }
        return ret;
    }
    build() {
        let { IX, ID, IXs, values } = this.param;
        let sql = 'set @ret=\'\'' + MySqlBuilder_1.sqlLineEnd;
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
                    sql += MySqlBuilder_1.retTab;
                    ixValue.ix = { value: '@id' };
                    break;
                default:
                    ixValue.ix = ix;
                    break;
            }
            switch (typeof xi) {
                case 'object':
                    sql += this.buildSaveIDWithoutRet(ID, xi);
                    sql += MySqlBuilder_1.retTab;
                    ixValue.xi = { value: '@id' };
                    break;
                default:
                    ixValue.xi = xi;
                    break;
            }
            sql += this.buildSaveIX(IX, ixValue);
            sql += this.buildIXs(IXs, ixValue);
        }
        this.sql = sql + 'select @ret as ret' + MySqlBuilder_1.sqlLineEnd;
    }
    buildIXs(IXs, ixValue) {
        if (!IXs)
            return '';
        let sql = '';
        for (let IXi of IXs) {
            let { IX, ix } = IXi;
            ixValue.ix = ix ?? { value: '@user' };
            sql += this.buildSaveIX(IX, ixValue);
        }
        return sql;
    }
}
exports.SqlActIX = SqlActIX;
//# sourceMappingURL=SqlActIX.js.map