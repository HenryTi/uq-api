"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BVarStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
class BVarStatement extends bstatement_1.BStatement {
    body(sqls) {
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
            declare.var(vSetFlag, new il_1.TinyInt());
            let setFlag = factory.createSet();
            sqls.push(setFlag);
            setFlag.equ(vSetFlag, sql_1.ExpVal.null);
            let sel = (0, select_1.convertSelect)(this.context, select);
            sqls.push(sel);
            sel.column(sql_1.ExpNum.num1, vSetFlag);
            sel.lock = select_1.LockType.update;
            let iff = factory.createIf();
            sqls.push(iff);
            iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(vSetFlag));
            for (let col of columns) {
                let set = factory.createSet();
                iff.then(set);
                set.equ(varFromCol(col), sql_1.ExpVal.null);
            }
        }
        else {
            for (let v of vars) {
                let set = factory.createSet();
                let exp = (0, sql_1.convertExp)(this.context, v.exp);
                if (exp !== undefined) {
                    set.equ(v.pointer.varName(v.name), exp);
                    sqls.push(set);
                }
            }
        }
    }
}
exports.BVarStatement = BVarStatement;
function varFromCol(col) {
    let { alias, pointer } = col;
    let v;
    if (pointer !== undefined) {
        v = pointer.varName(alias);
    }
    else {
        v = alias;
    }
    return v;
}
//# sourceMappingURL=var.js.map