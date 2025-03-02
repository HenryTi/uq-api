import {
    EnumSysTable, BigInt, BizStatementPend, SetEqu, BizBinAct, BizAct, BizInAct, JoinType, JsonDataType,
    BinStateAct,
    BizStatementState
} from "../../../il";
import { ExpAdd, ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpIsNotNull, ExpIsNull, ExpNE, ExpNull, ExpNum, ExpStr, ExpSub, ExpVal, ExpVar, Statement } from "../../sql";
import { EntityTable, GlobalSiteTable } from "../../sql/statementWithFrom";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";


const a = 'a', b = 'b';
const pendFrom = '$pend';
const binId = '$bin';
export class BBizStatementState extends BStatement<BizStatementState> {
    // 可以发送sheet主表，也可以是Detail
    override body(sqls: Sqls) {
        const { context } = this;
        const { factory, varSite, varUser } = context;
        const { to, bizStatement: { bizAct: { binState: { sheetState: { sheet } } } } } = this.istatement;
        const memo = factory.createMemo();
        sqls.push(memo);
        let memoText = 'Biz State ';
        if (to === undefined) {
            memoText += 'END';
        }
        else {
            memoText += to.name;
        }
        memo.text = memoText;

        const tblIxState = new EntityTable(EnumSysTable.ixState, false);
        const varSheet = new ExpVar('$sheet');
        let del = factory.createDelete();
        sqls.push(del);
        del.tables = [a];
        del.from(new EntityTable(EnumSysTable.ixState, false, a));
        del.where(new ExpEQ(new ExpField('i', a), varSheet));

        let insert = factory.createInsert();
        sqls.push(insert);
        let expTo = new ExpNum(to === undefined ? sheet.id : to.id);
        insert.table = tblIxState;
        insert.cols = [
            { col: 'i', val: varSheet },
            { col: 'x', val: expTo },
        ];
    }
}
