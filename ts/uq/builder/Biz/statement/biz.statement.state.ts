import {
    EnumSysTable, BizStatementState,
    EnumStateTo
} from "../../../il";
import { ExpEQ, ExpField, ExpNum, ExpSelect, ExpVal, ExpVar } from "../../sql";
import { EntityTable } from "../../sql/statementWithFrom";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";
import { LockType } from "../../sql/select";

const a = 'a', b = 'b';
export class BBizStatementState extends BStatement<BizStatementState> {
    // 可以发送sheet主表，也可以是Detail
    override body(sqls: Sqls) {
        const { context } = this;
        const { factory, varSite, varUser } = context;
        const { to, bizStatement: { bizAct: { binState: { sheetState: { sheet } } } } } = this.istatement;
        const memo = factory.createMemo();
        sqls.push(memo);
        let toText: string;
        if (to === undefined) {
            debugger;
            toText = '';
        }
        else if (typeof to === 'number') {
            toText = EnumStateTo[to].toUpperCase();
        }
        else {
            toText = to.name;
        }
        memo.text = 'Biz State ' + toText;

        const tblIxState = new EntityTable(EnumSysTable.ixState, false);
        const varSheet = new ExpVar('$sheet');
        let del = factory.createDelete();
        sqls.push(del);
        del.tables = [a];
        del.from(new EntityTable(EnumSysTable.ixState, false, a));
        del.where(new ExpEQ(new ExpField('i', a), varSheet));

        function insertTo(toId: number) {
            insertToCols(varSheet, new ExpNum(toId));
        }
        function insertToCols(iVal: ExpVal, xVal: ExpVal) {
            let insert = factory.createInsert();
            sqls.push(insert);
            insert.table = tblIxState;
            insert.cols = [
                { col: 'i', val: iVal },
                { col: 'x', val: xVal },
            ];
        }
        if (typeof to === 'number') {
            switch (to) {
                default:
                    debugger;
                    break;
                case EnumStateTo.start:
                    let selectMe = factory.createSelect();
                    insertToCols(new ExpSelect(selectMe), varSheet);
                    selectMe.col('operator');
                    selectMe.lock = LockType.none;
                    selectMe.from(new EntityTable(EnumSysTable.sheet, false));
                    selectMe.where(new ExpEQ(new ExpField('id'), varSheet));
                    break;
                case EnumStateTo.end:
                    insertTo(sheet.id);
                    break;
                case EnumStateTo.back:
                    debugger;
                    break;
            }
        }
        else {
            insertTo(to.id);
        }
    }
}
