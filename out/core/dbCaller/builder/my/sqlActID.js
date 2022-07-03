"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActID = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlActID extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { ID, value, IX, ix } = this.param;
        let sql = 'set @ret=\'\'' + mySqlBuilder_1.sqlLineEnd;
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
        return sql + 'select @ret as ret' + mySqlBuilder_1.sqlLineEnd;
    }
}
exports.SqlActID = SqlActID;
//# sourceMappingURL=sqlActID.js.map