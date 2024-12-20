import * as sql from '../sql';
import { EntityTable, GlobalTable } from '../sql/statementWithFrom';
import { SysProcedures } from './sysProcedures';
import { charField, textField, Text, TinyInt } from '../../il';
import { ExpField, ExpEQ, ExpEQBinary, ExpVar, ExpIsNull, ExpNum, Statements, ExpSearchCase, ExpOr, ExpExists, ExpNot, ExpCmp, ExpAnd } from '../sql';
import { LockType } from '../sql/select';

// no used now. uq-api 自动生成
export class ProcProcedures extends SysProcedures {
    build() {
        this.saveProcProc(this.coreProc('$proc_save'));
        this.getProcProc(this.coreProc('$proc_get'));
    }

    private saveProcProc(proc: sql.Procedure) {
        let { factory } = this.context;
        proc.parameters.push(
            charField('schema', 200),
            charField('name', 200),
            textField('proc'),
        );
        let tblProc = new EntityTable('$proc', false);
        let declare = factory.createDeclare();
        proc.statements.push(declare);
        declare.var('procOld', new Text());
        declare.var('changed', new TinyInt());

        let iifClear = factory.createIf();
        proc.statements.push(iifClear);
        iifClear.cmp = new ExpIsNull(new ExpVar('proc'));
        let clearFlag = factory.createUpdate();
        iifClear.then(clearFlag);
        clearFlag.cols = [
            { col: 'changed', val: ExpNum.num0 }
        ];
        clearFlag.table = tblProc;
        clearFlag.where = new ExpEQ(new ExpField('name'), new ExpVar('name'));
        let ret = factory.createLeaveProc();
        iifClear.then(ret);

        let select = factory.createSelect();
        proc.statements.push(select);
        select.toVar = true;
        select.col('proc', 'procOld');
        select.from(tblProc);
        select.where(new ExpEQ(new ExpField('name'), new ExpVar('name')));
        select.lock = LockType.update;

        let set1 = factory.createSet();
        set1.equ('changed', ExpNum.num1);
        proc.statements.push(set1);

        let iif = factory.createIf();
        proc.statements.push(iif);
        iif.cmp = new ExpIsNull(new ExpVar('procOld'));
        let insert = factory.createInsert();
        iif.then(insert);
        insert.table = tblProc;
        insert.cols = [
            { col: 'name', val: new ExpVar('name') },
            { col: 'proc', val: new ExpVar('proc') },
            { col: 'changed', val: ExpNum.num1 }
        ];

        let elseIfStats = new Statements();
        let set0 = factory.createSet();
        set0.equ('changed', ExpNum.num0);
        elseIfStats.add(set0);
        iif.elseIf(new ExpEQBinary(new ExpVar('proc'), new ExpVar('procOld')), elseIfStats);

        let update = factory.createUpdate()
        update.table = tblProc;
        update.cols = [
            { col: 'proc', val: new ExpVar('proc') },
            { col: 'changed', val: ExpNum.num1 }
        ];
        update.where = new ExpEQ(new ExpField('name'), new ExpVar('name'));
        iif.else(update);

        let retSelect = factory.createSelect();
        proc.statements.push(retSelect);
        retSelect.column(
            this.expProcChangedOrNotExists(new ExpEQ(new ExpVar('changed'), ExpNum.num1)),
            'changed');
    }

    private getProcProc(proc: sql.Procedure) {
        let { factory } = this.context;
        proc.parameters.push(
            charField('schema', 200),
            charField('name', 200),
        );

        let select = factory.createSelect()
        select.from(new EntityTable('$proc', false));
        select.col('proc');
        select.column(this.expProcChangedOrNotExists(new ExpEQ(new ExpField('changed'), ExpNum.num1)), 'changed');
        select.where(new ExpEQ(new ExpField('name'), new ExpVar('name')));
        select.lock = LockType.update;
        proc.statements.push(select);
    }

    private expProcChangedOrNotExists(expChanged: ExpCmp) {
        let { factory } = this.context;
        let collate = 'utf8_general_ci';
        let selectRoutine = factory.createSelect();
        selectRoutine.col('ROUTINE_BODY');
        selectRoutine.from(new GlobalTable('information_schema', 'routines'));
        selectRoutine.where(
            new ExpAnd(
                new ExpEQ(new ExpField('ROUTINE_SCHEMA', undefined, collate), new ExpVar('schema', collate)),
                new ExpEQ(new ExpField('ROUTINE_NAME', undefined, collate), new ExpVar('name', collate))
            )
        );
        let or = [
            expChanged,
            new ExpNot(new ExpExists(selectRoutine))
        ];
        return new ExpSearchCase(
            [new ExpOr(...or), ExpNum.num1],
            ExpNum.num0
        );
    }
}
