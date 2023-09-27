import { convertExp, ExpEQ, ExpFunc, ExpIsNull, ExpNull, ExpNum, ExpSelect, ExpVal, ExpVar } from "..";
import { Column, SetStatement, TinyInt } from "../../il";
import { convertSelect, LockType } from "../sql/select";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

export class BSetStatement extends BStatement {
    protected istatement: SetStatement;

    body(sqls: Sqls) {
        let { select, out } = this.istatement;
        let factory = this.context.factory;
        let { columns, from, where } = select;
        if (out !== true) {
            if (!from && !where) {
                for (let col of columns) {
                    let set = factory.createSet();
                    sqls.push(set);
                    set.equ(varFromCol(col), convertExp(this.context, col.value) as ExpVal);
                }
                return;
            }
            if (columns.length === 1) {
                let set = factory.createSet();
                sqls.push(set);
                let sel = convertSelect(this.context, select);
                sel.toVar = false;
                set.equ(varFromCol(columns[0]), new ExpSelect(sel));
                return;
            }
        }
        const vSetFlag = '$set_flag';
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(vSetFlag, new TinyInt());
        let setFlag = factory.createSet();
        sqls.push(setFlag);
        setFlag.equ(vSetFlag, ExpVal.null);
        let sel = convertSelect(this.context, select);
        sqls.push(sel);
        sel.column(ExpNum.num1, vSetFlag);
        sel.lock = LockType.update;
        let iff = factory.createIf();
        sqls.push(iff);
        iff.cmp = new ExpIsNull(new ExpVar(vSetFlag));
        for (let col of columns) {
            let set = factory.createSet();
            iff.then(set);
            set.equ(varFromCol(col), ExpVal.null);
        }
    }
}

function varFromCol(col: Column): string {
    let { alias, pointer } = col;
    let v: string;
    if (pointer !== undefined) {
        v = pointer.varName(alias);
    }
    else {
        v = alias;
    }
    return v;
}