"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDTv = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIDTv extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, ids) {
        super(builder);
        this.ids = ids;
    }
    build() {
        let idTbl = '$id';
        if (this.ids[0] < 0) {
            idTbl += '_local';
            for (let i = 0; i < this.ids.length; i++)
                this.ids[i] = -this.ids[i];
        }
        let sql = `
SELECT a.id, b.name as $type, a.name as $tv 
	FROM tv_${idTbl} as a 
		JOIN tv_$entity as b ON a.entity=b.id 
	WHERE a.id in (${this.ids.join(',')})` + mySqlBuilder_1.sqlEndStatement;
        return sql;
    }
}
exports.SqlIDTv = SqlIDTv;
//# sourceMappingURL=sqlIDTv.js.map