"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActs = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlActs extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { $ } = this.param;
        let arr = $;
        let sql = 'set @ret=\'\'' + mySqlBuilder_1.sqlLineEnd;
        for (let i = 0; i < arr.length; i++) {
            let p = this.param[arr[i]];
            switch (p.schema.type) {
                case 'id':
                    sql += this.buildSaveIDWithRet(p);
                    break;
                case 'idx':
                    sql += this.buildSaveIDX(p);
                    break;
                case 'ix':
                    sql += this.buildSaveIX(p);
                    break;
            }
        }
        return sql + 'select @ret as ret' + mySqlBuilder_1.sqlLineEnd;
    }
}
exports.SqlActs = SqlActs;
//# sourceMappingURL=sqlActs.js.map