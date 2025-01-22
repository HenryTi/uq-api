import {
    EnumSysTable, BizStatementSheet
    , bigIntField
} from "../../../il";
import { $site } from "../../consts";
import {
    ExpFuncInUq
    , ExpNull, ExpNum, ExpStr, ExpVal, ExpVar, Statement
} from "../../sql";
import { EntityTable } from "../../sql/statementWithFrom";
import { buildSetSheetBud } from "../../tools";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";

export class BBizStatementSheet extends BStatement<BizStatementSheet> {
    override body(sqls: Sqls) {
        const { detail } = this.istatement;
        if (detail === undefined) this.buildMain(sqls);
        else this.buildDetail(sqls);
    }

    private buildMain(sqls: Sqls) {
        const { factory } = this.context;
        const { useSheet } = this.istatement;
        const { sheet } = useSheet;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Sheet ' + sheet.getJName();
        const setId = factory.createSet();
        sqls.push(setId);
        let idVarName = useSheet.varName;
        let idParams: ExpVal[] = [
            new ExpVar($site),
            ExpNum.num0,
            ExpNum.num1,
            ExpNull.null,
            new ExpNum(sheet.id),
            new ExpFuncInUq('$no', [new ExpVar($site), new ExpStr('sheet'), ExpNull.null], true),
        ];
        setId.equ(idVarName, new ExpFuncInUq('sheet$id', idParams, true));
        sqls.push(...this.createUpdate(idVarName));
    }

    private buildDetail(sqls: Sqls) {
        const { factory } = this.context;
        let idVarName = 'detail$id';
        const declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars(bigIntField(idVarName));
        const { useSheet, bin } = this.istatement;
        const { varName, sheet } = useSheet;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = `Biz Detail ${bin.getJName()} OF Sheet ${sheet.getJName()}`;
        const setBinId = factory.createSet();
        sqls.push(setBinId);
        let idParams: ExpVal[] = [
            new ExpVar($site),
            ExpNum.num0,
            ExpNum.num1,
            ExpNull.null,
            new ExpFuncInUq('bud$id', [
                new ExpVar($site), ExpNum.num0, ExpNum.num1, ExpNull.null
                , new ExpVar(varName), new ExpNum(bin.id)
            ], true),
        ];
        setBinId.equ(idVarName, new ExpFuncInUq('detail$id', idParams, true));
        sqls.push(...this.createUpdate(idVarName));
    }

    private createUpdate(idVarName: string) {
        const { factory } = this.context;
        const varId = new ExpVar(idVarName);
        const insert = factory.createInsert();
        const { fields, buds, bin } = this.istatement;
        const { cols } = insert;
        const { props } = bin;
        cols.push({ col: 'id', val: varId });
        for (let i in fields) {
            cols.push({ col: i, val: this.context.expVal(fields[i]) });
        }
        insert.table = new EntityTable(EnumSysTable.bizBin, false);

        let ret: Statement[] = [insert];
        for (let i in buds) {
            let val = buds[i];
            let bud = props.get(i);
            let memo = factory.createMemo();
            ret.push(memo);
            memo.text = bud.getJName();
            let expVal = this.context.expVal(val);
            ret.push(...buildSetSheetBud(this.context, bud, varId, expVal));
        }
        return ret;
    }
}
