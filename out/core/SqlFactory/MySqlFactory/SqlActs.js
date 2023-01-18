"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActs = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlActs extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let ret = Object.assign({}, p);
        for (let i in p) {
            if (i === '$')
                continue;
            let ts = this.getTableSchema(i, ['id', 'idx', 'ix']);
            let values = p[i];
            if (values) {
                ts.values = values.map(v => this.buildValueTableSchema(v));
                ret[i] = ts;
            }
        }
        return ret;
    }
    build() {
        let { $ } = this.param;
        let arr = $;
        let sql = 'set @ret=\'\'' + MySqlBuilder_1.sqlLineEnd;
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
        this.sql = sql + 'select @ret as ret' + MySqlBuilder_1.sqlLineEnd;
    }
}
exports.SqlActs = SqlActs;
//# sourceMappingURL=SqlActs.js.map