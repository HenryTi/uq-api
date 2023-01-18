import { ParamIDDetailGet } from "../IDDefines";
import { MySqlBuilder } from "./MySqlBuilder";

export class SqlIDDetail extends MySqlBuilder<ParamIDDetailGet> {
    protected override convertParam(p: ParamIDDetailGet): ParamIDDetailGet {
        let { main, detail, detail2, detail3 } = p;
        let ret = Object.assign({}, p);
        let types = ['id'];
        ret.main = this.getTableSchema(main as unknown as string, types);
        ret.detail = this.getTableSchema(detail as unknown as string, types);
        if (detail2) {
            ret.detail2 = this.getTableSchema(detail2 as unknown as string, types);
        }
        if (detail3) {
            ret.detail3 = this.getTableSchema(detail3 as unknown as string, types);
        }
        return ret;
    }

    build(): string {
        let { id, main, detail, detail2, detail3 } = this.param;
        let sql = this.buildDetailSelect(main, '`id`=' + id);
        let whereMain = '`main`=' + id;
        sql += this.buildDetailSelect(detail, whereMain);
        sql += this.buildDetailSelect(detail2, whereMain);
        sql += this.buildDetailSelect(detail3, whereMain);
        return sql;
    }
}
