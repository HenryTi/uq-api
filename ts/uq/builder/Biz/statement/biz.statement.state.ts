import {
    EnumSysTable, BizStatementState,
    EnumStateTo,
    BigInt,
    JsonDataType
} from "../../../il";
import { ExpAnd, ExpEQ, ExpField, ExpFunc, ExpIsNotNull, ExpIsNull, ExpJsonProp, ExpNum, ExpSelect, ExpStr, ExpVal, ExpVar } from "../../sql";
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
        const { to, no, bizStatement: { bizAct: { binState: { sheetState: { sheet } } } } } = this.istatement;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const vCur = 'cur_' + no;
        const varCur = new ExpVar(vCur);
        const vStates = 'states_' + no;
        const varStates = new ExpVar(vStates);
        declare.var(vCur, new BigInt());
        declare.var(vStates, new JsonDataType());
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
        const varSheet = new ExpVar('$bin');
        const budStates = sheet.props.get('$states');
        const varStatesId = new ExpNum(budStates.id);

        let selectCur = factory.createSelect();
        sqls.push(selectCur);
        selectCur.toVar = true;
        selectCur.col('x', vCur);
        selectCur.from(tblIxState);
        selectCur.where(new ExpEQ(new ExpField('i'), varSheet));

        let tblIxJson = new EntityTable(EnumSysTable.ixJson, false);
        let ifCur = factory.createIf();
        sqls.push(ifCur);
        ifCur.cmp = new ExpIsNotNull(varCur);
        let selectStates = factory.createSelect();
        ifCur.then(selectStates);
        selectStates.toVar = true;
        selectStates.col('value', vStates);
        selectStates.from(tblIxJson);
        selectStates.where(new ExpAnd(
            new ExpEQ(new ExpField('i'), varSheet),
            new ExpEQ(new ExpField('x'), varStatesId),
        ));
        let ifStates = factory.createIf();
        ifCur.then(ifStates);
        ifStates.cmp = new ExpIsNull(varStates);
        let insertStates = factory.createInsert();
        ifStates.then(insertStates);
        insertStates.table = tblIxJson;
        insertStates.cols = [
            { col: 'i', val: varSheet },
            { col: 'x', val: varStatesId },
            { col: 'value', val: new ExpFunc('JSON_ARRAY', varCur) },
        ]
        let updateStates = factory.createUpdate();
        ifStates.else(updateStates);
        updateStates.table = tblIxJson;
        updateStates.cols = [
            {
                col: 'value',
                val: new ExpFunc(
                    'JSON_ARRAY_APPEND',
                    new ExpField('value'),
                    new ExpStr('$'),
                    varCur
                )
            }
        ];
        updateStates.where = new ExpAnd(
            new ExpEQ(new ExpField('i'), varSheet),
            new ExpEQ(new ExpField('x'), varStatesId),
        );
        let del = factory.createDelete();
        ifCur.then(del);
        del.tables = [a];
        del.from(new EntityTable(EnumSysTable.ixState, false, a));
        del.where(new ExpEQ(new ExpField('i', a), varSheet));

        function insertTo(toId: number) {
            insertToCols(varSheet, new ExpNum(toId));
        }
        function insertToCols(iVal: ExpVal, xVal: ExpVal) {
            let insert = factory.createInsert();
            sqls.push(insert);
            insert.ignore = true;
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
