import { ParamActID, TableSchema } from "../IDDefines";
import { MySqlBuilder, retTab, sqlLineEnd } from "./MySqlBuilder";

export class SqlActID extends MySqlBuilder<ParamActID> {
    protected convertParam(p: ParamActID): ParamActID {
        let { ID, value, IX, ix } = p;
        let ret = Object.assign({}, p);
        ret.ID = this.getTableSchema(ID as unknown as string, ['id']);
        ret.value = this.buildValueTableSchema(value);
        ret.IX = IX?.map(v => this.getTableSchema(v as unknown as string, ['ix']));
        ret.ix = ix?.map(v => this.buildValueTableSchema(v));
        return ret;
    }

    build(): void {
        let { ID, value, IX, ix } = this.param;
        let sql = 'set @ret=\'\'' + sqlLineEnd;
        sql += this.buildSaveIDWithRet(ID, value);
        if (IX) {
            let ixValue = { ix: undefined, xi: null };
            let len = IX.length;
            for (let i = 0; i < len; i++) {
                let IXi = IX[i];
                ixValue.ix = ix[i];
                sql += this.buildSaveIX(IXi, ixValue);
            }
        }
        this.sql = sql + 'select @ret as ret' + sqlLineEnd;
    }
}
