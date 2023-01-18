import { ParamActIXSort } from "../IDDefines";
import { MySqlBuilder, sqlLineEnd } from "./MySqlBuilder";

export class SqlActIXSort extends MySqlBuilder<ParamActIXSort> {
    protected convertParam(p: ParamActIXSort): ParamActIXSort {
        let { IX } = p;
        let ret = Object.assign({}, p);
        ret.IX = this.getTableSchema(IX as unknown as string, ['ix']);
        return ret;
    }

    build(): void {
        let { IX, ix, xi: id, after } = this.param;
        let { name, schema } = IX;
        let { hasSort } = schema as any;
        if (hasSort === true) {
            let sql = `set @ret=\`${this.dbName}\`.${this.twProfix}${name}$sort(${ix},${id},${after})` + sqlLineEnd;
            this.sql = sql + 'select @ret as ret' + sqlLineEnd;
        }
        else {
            this.sql = 'select 0 as ret' + sqlLineEnd;
        }
    }
}
