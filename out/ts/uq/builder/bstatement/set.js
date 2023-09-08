"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSetStatement = void 0;
const __1 = require("..");
const il_1 = require("../../il");
const select_1 = require("../sql/select");
const bstatement_1 = require("./bstatement");
class BSetStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { select, out } = this.istatement;
        let factory = this.context.factory;
        let { columns, from, where } = select;
        if (out !== true) {
            if (!from && !where) {
                for (let col of columns) {
                    let set = factory.createSet();
                    sqls.push(set);
                    set.equ(varFromCol(col), (0, __1.convertExp)(this.context, col.value));
                }
                return;
            }
            if (columns.length === 1) {
                let set = factory.createSet();
                sqls.push(set);
                let sel = (0, select_1.convertSelect)(this.context, select);
                sel.toVar = false;
                set.equ(varFromCol(columns[0]), new __1.ExpSelect(sel));
                return;
            }
        }
        const vSetFlag = '$set_flag';
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(vSetFlag, new il_1.TinyInt());
        let setFlag = factory.createSet();
        sqls.push(setFlag);
        setFlag.equ(vSetFlag, new __1.ExpNull());
        let sel = (0, select_1.convertSelect)(this.context, select);
        sqls.push(sel);
        sel.column(__1.ExpNum.num1, vSetFlag);
        sel.lock = select_1.LockType.update;
        let iff = factory.createIf();
        sqls.push(iff);
        iff.cmp = new __1.ExpIsNull(new __1.ExpVar(vSetFlag));
        for (let col of columns) {
            let set = factory.createSet();
            iff.then(set);
            set.equ(varFromCol(col), new __1.ExpNull());
        }
    }
}
exports.BSetStatement = BSetStatement;
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
//# sourceMappingURL=set.js.map