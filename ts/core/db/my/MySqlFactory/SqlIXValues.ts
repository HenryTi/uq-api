import { ParamIXValues } from "../../IDDefines";
import { MySqlBuilder } from "./MySqlBuilder";

export class SqlIXValues extends MySqlBuilder<ParamIXValues> {
    protected convertParam(p: ParamIXValues): ParamIXValues {
        let { IX } = p;
        let param = Object.assign({}, p);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        return param;
    }

    build(): void {
        let { IX, ix, page, order } = this.param;
        let xiType: number = (IX.schema as any).xiType
        let tStart: number, tSize: number;
        if (page) {
            let { start, size } = page;
            tStart = start ?? null;
            tSize = size ?? null;
        }
        if (!order) order = 'asc';
        this.sql = `call ${this.dbName}.${this.twProfix}$ix_values(@unit, @user, '${IX.name}', '${xiType}', ${ix}, ${tStart}, ${tSize}, '${order}' )`;

        this.buildCall();
    }

    private buildCall(): void {
        let proc = `${this.twProfix}$ix_values`;
        let { IX, ix, page, order } = this.param;
        let xiType: number = (IX.schema as any).xiType
        let tStart: number, tSize: number;
        if (page) {
            let { start, size } = page;
            tStart = start;
            tSize = size;
        }
        if (!order) order = 'asc';
        let callParams: any[] = [
            IX.name, xiType, ix, tStart, tSize, order
        ];
        //let sql = `call ${this.dbName}.${this.twProfix}$ix_values(@unit, @user, '${IX.name}', '${xiType}', ${ix}, ${tStart}, ${tSize}, '${order}' )`;
        this.proc = proc;
        this.procParameters = callParams;
    }
}
