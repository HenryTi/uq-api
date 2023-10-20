import { Char, FromStatement } from "../../il";
import { ExpField, ExpFunc, ExpNum, ExpStr, ExpVal } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

export class BFromStatement extends BStatement<FromStatement> {
    body(sqls: Sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';

        const { asc, cols, where } = this.istatement;
        const t1 = 't1';
        const select = factory.createSelect();
        sqls.push(select);
        select.column(new ExpNum(1000), 'id');
        select.column(ExpNum.num0, 'ban');
        const arr: ExpVal[] = [];
        for (let col of cols) {
            const { name, val } = col;
            arr.push(new ExpStr(name), this.context.expVal(val));
        }
        let tbl = new EntityTable('atom', false, t1);
        select.from(tbl);
        select.column(new ExpFunc('JSON_OBJECT', ...arr), 'json');
        select.where(this.context.expCmp(where));
        select.order(new ExpField('id', t1), asc);
    }
}
