import { BizPhraseType, Char, FromStatement, JoinType } from "../../il";
import { ExpField, ExpFunc, ExpNum, ExpStr, ExpVal } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { Select } from '../sql/select';
import { EnumSysTable } from "../dbContext";

const t1 = 't1';

export class BFromStatement extends BStatement<FromStatement> {
    body(sqls: Sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';

        const { asc, cols, where } = this.istatement;
        const select = factory.createSelect();
        sqls.push(select);
        select.column(new ExpNum(1000), 'id');
        select.column(ExpNum.num0, 'ban');
        const arr: ExpVal[] = [];
        for (let col of cols) {
            const { name, val } = col;
            arr.push(new ExpStr(name), this.context.expVal(val));
        }

        let tbl: string;

        function atomSelect() {
            tbl = EnumSysTable.atom;
        }
        function specSelect() {
            tbl = EnumSysTable.spec;
        }
        function binSelect() {
            tbl = EnumSysTable.bizBin;
        }
        function sheetSelect() {
            tbl = EnumSysTable.sheet;
        }
        function pendSelect() {
            tbl = EnumSysTable.pend;
        }
        const { bizPhraseType } = this.istatement;
        switch (bizPhraseType) {
            case BizPhraseType.atom: atomSelect(); break;
            case BizPhraseType.spec: specSelect(); break;
            case BizPhraseType.bin: binSelect(); break;
            case BizPhraseType.sheet: sheetSelect(); break;
            case BizPhraseType.pend: pendSelect(); break;
        }

        select.from(new EntityTable(tbl, false, t1));
        select.column(new ExpFunc('JSON_OBJECT', ...arr), 'json');
        select.where(this.context.expCmp(where));
        select.order(new ExpField('id', t1), asc);
    }
}
