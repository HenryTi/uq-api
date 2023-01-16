import { ParamIXSum } from "../../dbCaller";
import { Builder } from "../Builder";
import { MySqlBuilder, sqlLineEnd } from "./mySqlBuilder";

export class SqlIXSum extends MySqlBuilder {
    private param: ParamIXSum;

    constructor(builder: Builder, param: ParamIXSum) {
        super(builder);
        this.param = param;
    }

    build(): string {
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
        return sql;
    }
}
