import { ParamActIX, TableSchema } from "../IDDefines";
import { MySqlBuilder, retTab, sqlLineEnd } from "./MySqlBuilder";

export class SqlActIX extends MySqlBuilder<ParamActIX> {
    protected convertParam(p: ParamActIX): ParamActIX {
        let { IX, ID: ID, IXs, values } = p;
        let ret = Object.assign({}, p);
        ret.IX = this.getTableSchema(IX as unknown as string, ['ix']);
        ret.ID = this.getTableSchema(ID as unknown as string, ['id']);
        if (IXs) {
            ret.IXs = IXs.map(v => {
                let { IX, ix } = v;
                return { IX: this.getTableSchema(IX as unknown as string, ['ix']), ix }
            })
        }
        if (values) {
            ret.values = values.map(v => this.buildValueTableSchema(v));
        }
        return ret;
    }

    build(): void {
        let { IX, ID, IXs, values } = this.param;
        let sql = 'set @ret=\'\'' + sqlLineEnd;
        for (let value of values) {
            let { ix, xi } = value;
            if (!xi) continue;
            let ixValue = { ix: undefined, xi: undefined };
            switch (typeof ix) {
                case 'undefined':
                    ixValue.ix = { value: '@user' };
                    break;
                case 'object':
                    sql += this.buildSaveIDWithoutRet(ID, ix);
                    sql += retTab;
                    ixValue.ix = { value: '@id' };
                    break;
                default:
                    ixValue.ix = ix;
                    break;
            }
            switch (typeof xi) {
                case 'object':
                    sql += this.buildSaveIDWithoutRet(ID, xi);
                    sql += retTab;
                    ixValue.xi = { value: '@id' };
                    break;
                default:
                    ixValue.xi = xi;
                    break;
            }
            sql += this.buildSaveIX(IX, ixValue);
            sql += this.buildIXs(IXs, ixValue);
        }
        this.sql = sql + 'select @ret as ret' + sqlLineEnd;
    }

    private buildIXs(IXs: { IX: TableSchema; ix: number }[], ixValue: { ix: any, xi: any }): string {
        if (!IXs) return '';
        let sql = '';
        for (let IXi of IXs) {
            let { IX, ix } = IXi;
            ixValue.ix = ix ?? { value: '@user' };
            sql += this.buildSaveIX(IX, ixValue);
        }
        return sql;
    }
}
