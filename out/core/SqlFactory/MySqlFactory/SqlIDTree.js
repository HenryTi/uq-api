"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDTree = void 0;
const MySqlBuilder_1 = require("./MySqlBuilder");
class SqlIDTree extends MySqlBuilder_1.MySqlBuilder {
    convertParam(p) {
        let { ID } = p;
        let param = Object.assign({}, p);
        param.ID = this.getTableSchema(ID, ['id']);
        return param;
    }
    build() {
        let { ID, parent, key, level, page } = this.param;
        if (!level)
            level = 1;
        let keyField = ID.schema.keys[1];
        let { name: keyName, type } = keyField;
        let table = `\`${this.twProfix}${ID.name}\``;
        let eq, as;
        if (type === 'textid') {
            eq = `${this.twProfix}$textid('${key}')`;
            as = `${this.twProfix}$idtext(a.\`${keyName}\`) as \`${keyName}\``;
        }
        else {
            eq = `'${key}'`;
            as = `a.\`${keyName}\` as \`${keyName}\``;
        }
        function select(n) {
            let s = `select t${n}.id from ${table} as t1`;
            for (let i = 2; i <= n; i++)
                s += ` join ${table} as t${i} on t${i - 1}.id=t${i}.parent`;
            s += ` where t1.parent=${parent}`;
            if (key)
                s += ` and t1.${keyName}=${eq}`;
            return s;
        }
        let sql = `select a.id, a.parent, ${as} from ${table} as a join (`;
        sql += select(1);
        for (let i = 2; i <= level; i++)
            sql += ` union (${select(i)})`;
        sql += ') as t on a.id=t.id where 1=1';
        if (page !== undefined) {
            let { start, size } = page;
            if (!start)
                start = 0;
            sql += ` AND a.id>${start} limit ${size}`;
        }
        return sql;
    }
}
exports.SqlIDTree = SqlIDTree;
//# sourceMappingURL=SqlIDTree.js.map