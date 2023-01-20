import { ParamIXSum } from "../../IDDefines";
import { sqlLineEnd } from "./MySqlBuilder";
import { SqlSum } from "./SqlIDSum";

export class SqlIXSum extends SqlSum<ParamIXSum> {
    protected override convertParam(p: ParamIXSum): ParamIXSum {
        return this.checkIDXSumField(p);
    }

    override build(): void {
        let { IX, ix, page } = this.param;
        let sql = this.buildSumSelect(this.param);
        sql += ` RIGHT JOIN \`${this.twProfix}${IX.name}\` as t0 ON t0.xi=t.id WHERE 1=1`;
        if (this.hasUnit === true) {
            sql += ' AND t0.$unit=@unit';
        }
        sql = ' AND t0.ix' + (Array.isArray(ix) ?
            ' in (' + ix.join(',') + ')'
            :
            '=' + ix);
        if (page) {
            let { start } = page;
            if (!start) start = 0;
            sql += ' AND t0.xi>' + start;
        }
        sql += ' ORDER BY t0.xi ASC';
        if (page) sql += ' LIMIT ' + page.size;
        sql += sqlLineEnd;
        this.sql = sql;
    }
}
