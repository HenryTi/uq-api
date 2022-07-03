import { ParamActID, TableSchema } from "../../dbCaller";
import { Builders } from "../builders";
import { MySqlBuilder, retTab, sqlLineEnd } from "./mySqlBuilder";

export class SqlActID extends MySqlBuilder {
    private param: ParamActID;

    constructor(builder: Builders, param: ParamActID) {
        super(builder);
        this.param = param;
    }

    build(): string {
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
        return sql + 'select @ret as ret' + sqlLineEnd;
    }
}
