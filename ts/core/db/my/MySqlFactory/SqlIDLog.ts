import { ParamIDLog } from "../../IDDefines";
import { MySqlBuilder } from "./MySqlBuilder";

export class SqlIDLog extends MySqlBuilder<ParamIDLog> {
    protected override convertParam(p: ParamIDLog): ParamIDLog {
        let { IDX, field } = p;
        let param = Object.assign({}, p);
        let ts = this.getTableSchema((IDX as unknown) as string, ['idx']);
        param.IDX = ts;
        let fLower = field.toLowerCase();
        if (ts.schema.fields.findIndex(v => v.name.toLowerCase() === fLower) < 0) {
            this.throwErr(`ID ${IDX} has no Field ${field}`);
        }
        return param;
    }

    override build(): void {
        let { IDX, field, id, log, timeZone, page, far, near } = this.param;
        field = field.toLowerCase();
        let { start, size } = page;
        if (!start) start = Number.MAX_SAFE_INTEGER;
        let { name } = IDX;
        let span = '';
        if (far) span += ` AND a.t>=${far}`;
        if (near) span += ` AND a.t<${near}`;
        let table = '`' + this.twProfix + name + '$' + field + '`';
        let cols = 'a.t, a.v, a.u, a.a';
        let group: string;
        let time = `from_unixtime(a.t/1000+${timeZone}*3600)`;
        switch (log) {
            default:
                this.sql = `select 'IDX ${name} ${field}' log ${log} unknown`;
                return;
            case 'each':
                this.sql = `SELECT ${cols} FROM ${table} as a WHERE a.id=${id} AND a.t<${start} ${span} ORDER BY a.t DESC LIMIT ${size}`;
                return;
            case 'day': group = `DATE_FORMAT(${time}, '%Y-%m-%d')`;; break;
            case 'week': group = `YEARWEEK(${time}, 2)`; break;
            case 'month': group = `DATE_FORMAT(${time}, '%Y-%m-01')`; break;
            case 'year': group = `DATE_FORMAT(${time}, '%Y-01-01')`; break;
        }
        this.sql = `select ${group} as t, sum(a.v) as v from ${table} as a where a.t<${start} and a.id=${id} ${span} group by ${group} order by t limit ${size}`;
    }
}
