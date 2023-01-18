"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActID = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlActID extends MySqlBuilder_1.MySqlBuilder {
    constructor(factory, param) {
        super(factory);
        this.param = this.convertParam(param);
    }
    build() {
        let { ID, value, IX, ix } = this.param;
        let sql = 'set @ret=\'\'' + MySqlBuilder_1.sqlLineEnd;
        sql += this.buildSaveIDWithRet(ID, value);
        if (IX) {
            let ixValue = { ix: undefined, xi: null };
            let len = IX.length;
            for (let i = 0; i < len; i++) {
                let IXi = IX[i];
                ixValue.ix = ix[i];
                sql += this.buildSaveIX(IXi, ixValue);
            }
        }
        this.sql = sql + 'select @ret as ret' + MySqlBuilder_1.sqlLineEnd;
    }
}
exports.SqlActID = SqlActID;
//# sourceMappingURL=SqlActID.js.map