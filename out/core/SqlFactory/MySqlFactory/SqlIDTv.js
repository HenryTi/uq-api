"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDTv = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIDTv extends MySqlBuilder_1.MySqlBuilder {
    constructor(factory, ids) {
        super(factory);
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
	FROM ${this.twProfix}${idTbl} as a 
		JOIN ${this.twProfix}$entity as b ON a.entity=b.id 
	WHERE a.id in (${this.ids.join(',')})` + MySqlBuilder_1.sqlLineEnd;
        return sql;
    }
}
exports.SqlIDTv = SqlIDTv;
//# sourceMappingURL=SqlIDTv.js.map