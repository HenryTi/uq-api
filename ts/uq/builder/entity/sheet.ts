import * as il from '../../il';
import { BEntity, BEntityBusable } from './entity';
import { Sqls } from '../bstatement';
import * as sql from '../sql';
import { EntityTable } from '../sql/statementWithFrom';
import { ExpEQ, ExpField, ExpVar, ExpAdd, ExpAnd, ExpStr, ExpVal, ExpFunc } from '../sql';
import { EnumSysTable, SheetVerify, ActionBase, Field, Arr, JoinType } from '../../il';
import { Statement } from '../sql';
import { sysTable } from '../dbContext';

export class BSheet extends BEntity<il.Sheet> {
    buildProcedures() {
        let { verify, start, states } = this.entity;
        if (verify !== undefined) {
            let bVerify = new BSheetVerify(this.context, verify);
            bVerify.buildProcedures();
        }
        let bStart = new BSheetState(this.context, start);
        bStart.buildProcedures();
        for (let i in states) {
            let sheetState = new BSheetState(this.context, states[i]);
            sheetState.buildProcedures();
        };
    }
}

class BSheetVerify extends BEntity<SheetVerify> {
    protected get actionProcName() {
        return this.entity.sheet.name + '$verify';
    }

    buildProcedures() {
        this.buildVerifyProcedure();
        this.buildInBusProcedures(this.entity);
    }

    private buildVerifyProcedure() {
        let { returns, statement } = this.entity;
        let factory = this.context.factory;
        let proc = this.context.createAppProc(this.actionProcName);
        proc.addUnitUserParameter();
        let { parameters, statements: stats } = proc;
        parameters.push(
            il.textField('$data'),
        );
        // 没有写库操作，所以不需要transaction
        this.returnsDeclare(stats, returns);
        this.dataParse(proc, stats, this.entity.sheet);
        const { statements } = statement;
        let sqls = new Sqls(this.context, stats);
        sqls.head(statements);
        let rb = this.context.returnStartStatement()
        rb.body(sqls);
        sqls.body(statements);
        let re = this.context.returnEndStatement();
        sqls.foot(statements);
        re.body(sqls);
        this.returns(stats, returns);
        sqls.done(proc);
        /*
        let retSelect = factory.createSelect();
        stats.push(retSelect);
        retSelect.column(ExpVal.num1, 'ok');
        */
        //stats.push(proc.createCommit());
    }
}

export class BSheetState extends BEntity<il.SheetState> {
    buildProcedures() {
        for (let i in this.entity.actions) {
            let sheetAction = new BSheetAction(this.context, this.entity.actions[i]);
            sheetAction.buildProcedures();
        };
    }
}

export class BSheetAction extends BEntityBusable<il.SheetAction> {
    protected get actionProcName() {
        let { sheetState } = this.entity;
        let sheet = sheetState.sheet;
        let stateName = sheetState.name;
        let name = stateName === undefined ?
            sheet.name + '_' + this.entity.name :
            sheet.name + '_' + stateName + '_' + this.entity.name;
        return name;
    }

    protected buildInBusGetData(): Statement[] {
        const vData = '$data', ta = 'a', tb = 'b', tc = 'c';
        let sel = this.context.factory.createSelect();
        sel.toVar = true;
        sel.column(new ExpField('data', ta), vData);
        sel.from(this.context.sysTable(EnumSysTable.sheet, ta));
        sel.where(new ExpEQ(new ExpField('id', ta), new ExpVar('$data')));
        return [sel];
    }

    protected getInBusDataParseActionBase(): ActionBase {
        return this.entity.sheet as ActionBase;
    }

    buildProcedures() {
        this.buildInBusProcedures(this.entity);
        let { factory, hasUnit } = this.context;
        let { sheetState, returns, statement, buses } = this.entity;
        let sheet = sheetState.sheet;
        let proc = this.context.createAppProc(this.actionProcName);
        proc.addUnitUserParameter();
        let { parameters, statements } = proc;
        parameters.push(
            il.bigIntField('$id'),
            il.smallIntField('$flow'),
            il.charField('$action', 30),
        );
        let { inBuses } = this.entity;
        this.buildRoleCheck(statements);
        let declare = factory.createDeclare();
        statements.push(declare);
        this.declareBusVar(declare, buses, statements);
        this.declareInBusVars(declare, this.entity);
        let vState = '$state', vNewFlow = '$newFlow',
            vPreState = '$preState', vSheetType = '$sheetType',
            vUq = '$uq',
            vSheetApp = '$sheet_app', //vSheetApi = '$sheet_api',
            vSheetNo = '$sheet_no', vSheetUser = '$sheet_user', vSheetDate = '$sheet_date',
            vSheetVersion = '$sheet_version', vSheetDiscription = '$sheet_discription';
        declare.var(vState, new il.Char(30))
            .var(vNewFlow, new il.SmallInt())
            .var(vPreState, new il.Char(30))
            .var(vSheetApp, new il.Int())
            .var(vSheetNo, new il.Char(30))
            .var(vSheetUser, new il.BigInt)
            .var(vSheetDate, new il.DateTime)
            .var(vSheetVersion, new il.Int)
            .var(vUq, new il.Int)
            .var(vSheetDiscription, new il.Char(50));
        let vData = '$data', ta = 'a', tb = 'b', tc = 'c';
        let data = factory.createDeclare();
        statements.push(data);
        data.var(vData, new il.Text);

        //proc.declareRollbackHandler = true;
        statements.push(proc.createTransaction());

        let memo = factory.createMemo();
        statements.push(memo);
        memo.text = '单据可能从$sheet表中移到$archive，所以先取到变量中';
        let sel = factory.createSelect();
        statements.push(sel);
        sel.toVar = true;
        sel.column(new ExpField('data', ta), vData)
            .column(new ExpField('sheet', ta), vSheetType)
            .column(new ExpField('flow', ta), vNewFlow)
            .column(new ExpField('name', tc), vState)
            .column(new ExpField('name', tc), vPreState)
            .column(new ExpField('app', ta), vSheetApp)
            //.column(new ExpField('api', ta), vSheetApi)
            .column(new ExpField('no', ta), vSheetNo)
            .column(new ExpField('user', ta), vSheetUser)
            .column(new ExpField('date', ta), vSheetDate)
            .column(new ExpField('version', ta), vSheetVersion)
            .column(new ExpField('discription', ta), vSheetDiscription);
        sel.from(this.context.sysTable(EnumSysTable.sheet, ta));
        sel.join(JoinType.join, sysTable(EnumSysTable.flow, tb))
            .on(new sql.ExpAnd(
                new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tb)),
                new sql.ExpEQ(new sql.ExpField('flow', ta), new sql.ExpField('flow', tb)),
            ));
        sel.join(JoinType.join, sysTable(EnumSysTable.const, tc))
            .on(new sql.ExpEQ(new sql.ExpField('state', tb), new sql.ExpField('id', tc)));
        sel.where(new ExpEQ(new ExpField('id', ta), new ExpVar('$id')));

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpEQ(new ExpVar('$flow'), new ExpVar(vNewFlow));
        let thenStats = iff._then.statements;

        this.returnsDeclare(thenStats, returns);
        let set = factory.createSet();
        thenStats.push(set);
        set.equ(vNewFlow, new ExpAdd(new ExpVar(vNewFlow), ExpVal.num1));

        let arrs: Arr[] = [...sheet.arrs];
        if (inBuses !== undefined) {
            parameters.push(il.textField('$inBus'));
            for (let inBus of inBuses) {
                let inBusArrs = inBus.arrs;
                if (inBusArrs === undefined) continue;
                arrs.push(...inBusArrs);
            }
            let dataAddInBus = factory.createSet();
            thenStats.push(dataAddInBus);
            dataAddInBus.equ(vData, new ExpFunc(factory.func_concat, new ExpVar(vData), new ExpVar('$inBus')));
        }
        let dataSchema: { fields: Field[]; arrs: Arr[]; } = {
            fields: sheet.fields,
            arrs: arrs,
        }
        this.dataParse(proc, thenStats, dataSchema);
        const { statements: stats } = statement;
        let sqls = new Sqls(this.context, thenStats);
        sqls.head(stats);

        let rb = this.context.returnStartStatement()
        rb.body(sqls);
        sqls.body(stats);
        let re = this.context.returnEndStatement();
        sqls.foot(stats);
        re.body(sqls);

        this.buildBusWriteQueueStatement(thenStats, buses);
        this.returns(thenStats, returns);

        let updateProcessing = factory.createUpdate();
        statements.push(updateProcessing);
        updateProcessing.cols = [
            { col: 'processing', val: ExpVal.num0 }
        ];
        updateProcessing.table = this.context.sysTable(EnumSysTable.sheet);
        updateProcessing.where = new ExpEQ(new ExpField('id'), new ExpVar('$id'));

        let select1 = factory.createSelect();
        select1.column(new ExpVar('$id'), 'id');

        let selectUq = factory.createSelect();
        selectUq.toVar = true;
        selectUq.column(new sql.ExpField('value'), vUq);
        selectUq.from(new EntityTable('$setting', false));
        let wheres = [new ExpEQ(new ExpField('name'), new ExpStr('uqId'))];
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField('$unit'), ExpVal.num0));
        }
        selectUq.where(new ExpAnd(...wheres));
        statements.push(selectUq);

        let select = factory.createSelect();
        statements.push(select);
        select
            .column(new ExpVar('$id'), 'id')
            .column(new ExpVar(vNewFlow), 'flow')
            .column(new ExpVar('$preState'), 'preState')
            .column(new ExpVar('$action'), 'action')
            .column(new ExpVar('$state'), 'state')
            //.column(new ExpSelect(selectSheetTo), 'to')
            .column(new ExpVar(vSheetApp), 'app')
            .column(new ExpVar(vUq), 'uq')
            .column(new ExpVar(vSheetNo), 'no')
            .column(new ExpVar(vSheetUser), 'user')
            .column(new ExpVar(vSheetDate), 'date')
            .column(new ExpStr(sheet.name), 'name')
            .column(new ExpVar(vSheetType), 'sheet')
            .column(new ExpVar(vSheetVersion), 'version')
            .column(new ExpVar(vSheetDiscription), 'discription')
            .column(ExpVal.num0, 'processing');
        sqls.done(proc);

        statements.push(proc.createCommit());
    }
}
