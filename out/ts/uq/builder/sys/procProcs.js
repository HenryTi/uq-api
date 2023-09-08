"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcProcedures = void 0;
const statementWithFrom_1 = require("../sql/statementWithFrom");
const sysProcedures_1 = require("./sysProcedures");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
// no used now. uq-api 自动生成
class ProcProcedures extends sysProcedures_1.SysProcedures {
    build() {
        this.saveProcProc(this.coreProc('$proc_save'));
        this.getProcProc(this.coreProc('$proc_get'));
    }
    saveProcProc(proc) {
        let { factory } = this.context;
        proc.parameters.push((0, il_1.charField)('schema', 200), (0, il_1.charField)('name', 200), (0, il_1.textField)('proc'));
        let tblProc = new statementWithFrom_1.EntityTable('$proc', false);
        let declare = factory.createDeclare();
        proc.statements.push(declare);
        declare.var('procOld', new il_1.Text());
        declare.var('changed', new il_1.TinyInt());
        let iifClear = factory.createIf();
        proc.statements.push(iifClear);
        iifClear.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('proc'));
        let clearFlag = factory.createUpdate();
        iifClear.then(clearFlag);
        clearFlag.cols = [
            { col: 'changed', val: sql_1.ExpNum.num0 }
        ];
        clearFlag.table = tblProc;
        clearFlag.where = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('name'));
        let ret = factory.createLeaveProc();
        iifClear.then(ret);
        let select = factory.createSelect();
        proc.statements.push(select);
        select.toVar = true;
        select.col('proc', 'procOld');
        select.from(tblProc);
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('name')));
        select.lock = select_1.LockType.update;
        let set1 = factory.createSet();
        set1.equ('changed', sql_1.ExpNum.num1);
        proc.statements.push(set1);
        let iif = factory.createIf();
        proc.statements.push(iif);
        iif.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('procOld'));
        let insert = factory.createInsert();
        iif.then(insert);
        insert.table = tblProc;
        insert.cols = [
            { col: 'name', val: new sql_1.ExpVar('name') },
            { col: 'proc', val: new sql_1.ExpVar('proc') },
            { col: 'changed', val: sql_1.ExpNum.num1 }
        ];
        let elseIfStats = new sql_1.Statements();
        let set0 = factory.createSet();
        set0.equ('changed', sql_1.ExpNum.num0);
        elseIfStats.add(set0);
        iif.elseIf(new sql_1.ExpEQBinary(new sql_1.ExpVar('proc'), new sql_1.ExpVar('procOld')), elseIfStats);
        let update = factory.createUpdate();
        update.table = tblProc;
        update.cols = [
            { col: 'proc', val: new sql_1.ExpVar('proc') },
            { col: 'changed', val: sql_1.ExpNum.num1 }
        ];
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('name'));
        iif.else(update);
        let retSelect = factory.createSelect();
        proc.statements.push(retSelect);
        retSelect.column(this.expProcChangedOrNotExists(new sql_1.ExpEQ(new sql_1.ExpVar('changed'), sql_1.ExpNum.num1)), 'changed');
    }
    getProcProc(proc) {
        let { factory } = this.context;
        proc.parameters.push((0, il_1.charField)('schema', 200), (0, il_1.charField)('name', 200));
        let select = factory.createSelect();
        select.from(new statementWithFrom_1.EntityTable('$proc', false));
        select.col('proc');
        select.column(this.expProcChangedOrNotExists(new sql_1.ExpEQ(new sql_1.ExpField('changed'), sql_1.ExpNum.num1)), 'changed');
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('name')));
        select.lock = select_1.LockType.update;
        proc.statements.push(select);
    }
    expProcChangedOrNotExists(expChanged) {
        let { factory } = this.context;
        let collate = 'utf8_general_ci';
        let selectRoutine = factory.createSelect();
        selectRoutine.col('ROUTINE_BODY');
        selectRoutine.from(new statementWithFrom_1.GlobalTable('information_schema', 'routines'));
        selectRoutine.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('ROUTINE_SCHEMA', undefined, collate), new sql_1.ExpVar('schema', collate)), new sql_1.ExpEQ(new sql_1.ExpField('ROUTINE_NAME', undefined, collate), new sql_1.ExpVar('name', collate))));
        let or = [
            expChanged,
            new sql_1.ExpNot(new sql_1.ExpExists(selectRoutine))
        ];
        return new sql_1.ExpSearchCase([new sql_1.ExpOr(...or), sql_1.ExpNum.num1], sql_1.ExpNum.num0);
    }
}
exports.ProcProcedures = ProcProcedures;
//# sourceMappingURL=procProcs.js.map