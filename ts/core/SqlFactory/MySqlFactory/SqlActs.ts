import { ParamActs } from "../IDDefines";
import { MySqlBuilder, sqlLineEnd } from "./MySqlBuilder";

export class SqlActs extends MySqlBuilder<ParamActs> {
    protected convertParam(p: ParamActs): ParamActs {
        let ret = Object.assign({}, p);
        for (let i in p) {
            if (i === '$') continue;
            let ts = this.getTableSchema(i, ['id', 'idx', 'ix']);
            let values = (p[i] as unknown) as any[];
            if (values) {
                ts.values = values.map(v => this.buildValueTableSchema(v));
                ret[i] = ts;
            }
        }
        return ret;
    }

    build(): void {
        let { $ } = this.param;
        let arr = $ as unknown as string[];
        let sql = 'set @ret=\'\'' + sqlLineEnd;
        for (let i = 0; i < arr.length; i++) {
            let p = this.param[arr[i]];
            switch (p.schema.type) {
                case 'id': sql += this.buildSaveIDWithRet(p); break;
                case 'idx': sql += this.buildSaveIDX(p); break;
                case 'ix': sql += this.buildSaveIX(p); break;
            }
        }
        this.sql = sql + 'select @ret as ret' + sqlLineEnd;
    }
}
