import { ParamKeyIX } from "../IDDefines";
import { MySqlBuilder, sqlLineEnd } from "./MySqlBuilder";

export class SqlKeyIX extends MySqlBuilder<ParamKeyIX> {
    protected override convertParam(p: ParamKeyIX): ParamKeyIX {
        let { ID, IX, IDX } = p;
        let param = Object.assign({}, p);
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, ['id', 'idx']);
        return param;
    }

    build(): string {
        let { ID, IX, key, IDX, page } = this.param;
        let arr = [IX];
        if (IDX) arr.push(...IDX);
        let { cols, tables } = this.buildIDX(arr);

        let { name, schema } = ID;
        let { keys } = schema;
        let joinID = ' JOIN `' + this.twProfix + name + '` as t ON t.id=t0.id';
        let where = '';
        if (this.hasUnit === true) {
            where += 't.$unit=@unit'
        }
        for (let k of keys) {
            let v = key[k.name];
            if (v === undefined) continue;
            where += ' AND t.`' + k.name + '`=\'' + v + '\'';
        }
        if (page) {
            let { start } = page;
            if (!start) start = 0;
            where += ' AND t0.id>' + start;
        }
        let sql = `SELECT ${cols} FROM ${tables}${joinID} WHERE 1=1${where}`;
        sql += ' ORDER BY t0.id ASC';
        if (page) sql += ' LIMIT ' + page.size;
        sql += sqlLineEnd;
        return sql;
    }
}
