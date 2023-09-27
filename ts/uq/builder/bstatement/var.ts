import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { Column, TinyInt, VarStatement } from "../../il";
import { convertExp, ExpIsNull, ExpNull, ExpNum, ExpVal, ExpVar } from "../sql";
import { LockType, convertSelect } from "../sql/select";

export class BVarStatement extends BStatement {
    protected istatement: VarStatement;

    body(sqls: Sqls) {
        let { vars, select } = this.istatement;
        let { factory } = this.context;
        let declare = factory.createDeclare();
        for (let v of vars) {
            declare.var(v.pointer.varName(v.name), v.dataType);
        }
        sqls.push(declare);
        if (select !== undefined) {
            let { columns } = select;
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
        else {
            for (let v of vars) {
                let set = factory.createSet();
                let exp = convertExp(this.context, v.exp) as ExpVal;
                if (exp !== undefined) {
                    set.equ(v.pointer.varName(v.name), exp);
                    sqls.push(set);
                }
            }
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