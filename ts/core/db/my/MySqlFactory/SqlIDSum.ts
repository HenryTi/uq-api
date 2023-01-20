import { ParamIDSum, ParamSum } from "../../IDDefines";
import { MySqlBuilder } from "./MySqlBuilder";

export abstract class SqlSum<P extends ParamSum> extends MySqlBuilder<P> {
    protected checkIDXSumField(p: P): P {
        let param = Object.assign({}, p);
        let { IDX, field } = p;
        let ts = this.getTableSchema((IDX as unknown) as string, ['idx']);
        param.IDX = ts;
        for (let f of field) {
            let fLower = f.toLowerCase();
            if (ts.schema.fields.findIndex(v => v.name.toLowerCase() === fLower) < 0) {
                this.throwErr(`ID ${IDX} has no Field ${f}`);
            }
        }
        return param;
    }
}

export class SqlIDSum extends SqlSum<ParamIDSum> {
    protected override convertParam(p: ParamIDSum): ParamIDSum {
        return this.checkIDXSumField(p);
    }

    override build(): void {
        let { id } = this.param;
        let sql = this.buildSumSelect(this.param);
        if (id !== undefined) {
            sql += ' where t.id';
            if (Array.isArray(id) === true) {
                sql += ' in (' + (id as number[]).join() + ')';
            }
            else {
                sql += `=${id}`;
            }
        }
        this.sql = sql;
    }
}
