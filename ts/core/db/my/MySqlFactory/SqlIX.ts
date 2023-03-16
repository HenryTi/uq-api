import { ParamIX } from "../../IDDefines";
import { MySqlBuilder, sqlLineEnd } from "./MySqlBuilder";

export class SqlIX extends MySqlBuilder<ParamIX> {
    protected override convertParam(p: ParamIX): ParamIX {
        let { IX, IX1, IDX } = p;
        let param = Object.assign({}, p);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.IX1 = this.getTableSchema((IX1 as unknown) as string, ['ix']);
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, types);
        return param;
    }

    override build(): void {
        let { IX, IX1, ix, IDX, page, order } = this.param;
        let colsTables: { cols: string; tables: string; };
        let itemTable: number;
        if (IX1) {
            itemTable = 1;
            colsTables = this.buildIXIXIDX(IX, IX1, IDX);
        }
        else {
            itemTable = 0;
            colsTables = this.buildIXIDX(IX, IDX);
        }
        let { cols, tables } = colsTables;
        let where = '';
        if (ix === undefined || ix === null) {
            where = ` AND t0.ix=@user`;
        }
        else {
            if (Array.isArray(ix) === true) {
                if ((ix as []).length > 0) {
                    where = ` AND t0.ix in (${(ix as []).join(',')})`
                }
            }
            else {
                where = ` AND t0.ix=${ix}`;
            }
        }
        if (page) {
            let cmp: '<' | '>';
            let { start } = page;
            if (order === 'asc') {
                cmp = '>';
                start = start ?? 0;
            }
            else {
                cmp = '<';
                start = start ?? '0x7fffffffffffffff' as any;

            }
            where += ` AND t${itemTable}.xi${cmp}${start}`;
        }
        let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
        sql += ` ORDER BY t${itemTable}.xi ${this.buildOrder(order)}`;
        if (page) sql += ' LIMIT ' + page.size;
        sql += sqlLineEnd;
        this.sql = sql;
    }
}
