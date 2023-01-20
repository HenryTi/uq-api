"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDTv = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIDTv extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        return p;
    }
    build() {
        let idTbl = '$id';
        if (this.param[0] < 0) {
            idTbl += '_local';
            for (let i = 0; i < this.param.length; i++)
                this.param[i] = -this.param[i];
        }
        let sql = `
SELECT a.id, b.name as $type, a.name as $tv 
	FROM ${this.twProfix}${idTbl} as a 
		JOIN ${this.twProfix}$entity as b ON a.entity=b.id 
	WHERE a.id in (${this.param.join(',')})` + MySqlBuilder_1.sqlLineEnd;
        this.sql = sql;
    }
}
exports.SqlIDTv = SqlIDTv;
//# sourceMappingURL=SqlIDTv.js.map