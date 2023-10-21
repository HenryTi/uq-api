"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSheetAction = exports.BSheetState = exports.BSheet = void 0;
const il = require("../../il");
const entity_1 = require("./entity");
const bstatement_1 = require("../bstatement");
const sql = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const sql_1 = require("../sql");
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
class BSheet extends entity_1.BEntity {
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
        }
        ;
    }
}
exports.BSheet = BSheet;
class BSheetVerify extends entity_1.BEntity {
    get actionProcName() {
        return this.entity.sheet.name + '$verify';
    }
    buildProcedures() {
        this.buildVerifyProcedure();
        this.buildInBusProcedures(this.entity);
    }
    buildVerifyProcedure() {
        let { returns, statement } = this.entity;
        let factory = this.context.factory;
        let proc = this.context.createAppProc(this.actionProcName);
        proc.addUnitUserParameter();
        let { parameters, statements: stats } = proc;
        parameters.push(il.textField('$data'));
        // 没有写库操作，所以不需要transaction
        this.returnsDeclare(stats, returns);
        this.dataParse(proc, stats, this.entity.sheet);
        const { statements } = statement;
        let sqls = new bstatement_1.Sqls(this.context, stats);
        sqls.head(statements);
        let rb = this.context.returnStartStatement();
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
class BSheetState extends entity_1.BEntity {
    buildProcedures() {
        for (let i in this.entity.actions) {
            let sheetAction = new BSheetAction(this.context, this.entity.actions[i]);
            sheetAction.buildProcedures();
        }
        ;
    }
}
exports.BSheetState = BSheetState;
class BSheetAction extends entity_1.BEntityBusable {
    get actionProcName() {
        let { sheetState } = this.entity;
        let sheet = sheetState.sheet;
        let stateName = sheetState.name;
        let name = stateName === undefined ?
            sheet.name + '_' + this.entity.name :
            sheet.name + '_' + stateName + '_' + this.entity.name;
        return name;
    }
    buildInBusGetData() {
        const vData = '$data', ta = 'a', tb = 'b', tc = 'c';
        let sel = this.context.factory.createSelect();
        sel.toVar = true;
        sel.column(new sql_1.ExpField('data', ta), vData);
        sel.from(this.context.sysTable(il_1.EnumSysTable.sheet, ta));
        sel.where(new sql_1.ExpEQ(new sql_1.ExpField('id', ta), new sql_1.ExpVar('$data')));
        return [sel];
    }
    getInBusDataParseActionBase() {
        return this.entity.sheet;
    }
    buildProcedures() {
        this.buildInBusProcedures(this.entity);
        let { factory, hasUnit } = this.context;
        let { sheetState, returns, statement, buses } = this.entity;
        let sheet = sheetState.sheet;
        let proc = this.context.createAppProc(this.actionProcName);
        proc.addUnitUserParameter();
        let { parameters, statements } = proc;
        parameters.push(il.bigIntField('$id'), il.smallIntField('$flow'), il.charField('$action', 30));
        let { inBuses } = this.entity;
        this.buildRoleCheck(statements);
        let declare = factory.createDeclare();
        statements.push(declare);
        this.declareBusVar(declare, buses, statements);
        this.declareInBusVars(declare, this.entity);
        let vState = '$state', vNewFlow = '$newFlow', vPreState = '$preState', vSheetType = '$sheetType', vUq = '$uq', vSheetApp = '$sheet_app', //vSheetApi = '$sheet_api',
        vSheetNo = '$sheet_no', vSheetUser = '$sheet_user', vSheetDate = '$sheet_date', vSheetVersion = '$sheet_version', vSheetDiscription = '$sheet_discription';
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
        sel.column(new sql_1.ExpField('data', ta), vData)
            .column(new sql_1.ExpField('sheet', ta), vSheetType)
            .column(new sql_1.ExpField('flow', ta), vNewFlow)
            .column(new sql_1.ExpField('name', tc), vState)
            .column(new sql_1.ExpField('name', tc), vPreState)
            .column(new sql_1.ExpField('app', ta), vSheetApp)
            //.column(new ExpField('api', ta), vSheetApi)
            .column(new sql_1.ExpField('no', ta), vSheetNo)
            .column(new sql_1.ExpField('user', ta), vSheetUser)
            .column(new sql_1.ExpField('date', ta), vSheetDate)
            .column(new sql_1.ExpField('version', ta), vSheetVersion)
            .column(new sql_1.ExpField('discription', ta), vSheetDiscription);
        sel.from(this.context.sysTable(il_1.EnumSysTable.sheet, ta));
        sel.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.flow, tb))
            .on(new sql.ExpAnd(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tb)), new sql.ExpEQ(new sql.ExpField('flow', ta), new sql.ExpField('flow', tb))));
        sel.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.const, tc))
            .on(new sql.ExpEQ(new sql.ExpField('state', tb), new sql.ExpField('id', tc)));
        sel.where(new sql_1.ExpEQ(new sql_1.ExpField('id', ta), new sql_1.ExpVar('$id')));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('$flow'), new sql_1.ExpVar(vNewFlow));
        let thenStats = iff._then.statements;
        this.returnsDeclare(thenStats, returns);
        let set = factory.createSet();
        thenStats.push(set);
        set.equ(vNewFlow, new sql_1.ExpAdd(new sql_1.ExpVar(vNewFlow), sql_1.ExpVal.num1));
        let arrs = [...sheet.arrs];
        if (inBuses !== undefined) {
            parameters.push(il.textField('$inBus'));
            for (let inBus of inBuses) {
                let inBusArrs = inBus.arrs;
                if (inBusArrs === undefined)
                    continue;
                arrs.push(...inBusArrs);
            }
            let dataAddInBus = factory.createSet();
            thenStats.push(dataAddInBus);
            dataAddInBus.equ(vData, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar(vData), new sql_1.ExpVar('$inBus')));
        }
        let dataSchema = {
            fields: sheet.fields,
            arrs: arrs,
        };
        this.dataParse(proc, thenStats, dataSchema);
        const { statements: stats } = statement;
        let sqls = new bstatement_1.Sqls(this.context, thenStats);
        sqls.head(stats);
        let rb = this.context.returnStartStatement();
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
            { col: 'processing', val: sql_1.ExpVal.num0 }
        ];
        updateProcessing.table = this.context.sysTable(il_1.EnumSysTable.sheet);
        updateProcessing.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('$id'));
        let select1 = factory.createSelect();
        select1.column(new sql_1.ExpVar('$id'), 'id');
        let selectUq = factory.createSelect();
        selectUq.toVar = true;
        selectUq.column(new sql.ExpField('value'), vUq);
        selectUq.from(new statementWithFrom_1.EntityTable('$setting', false));
        let wheres = [new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('uqId'))];
        if (hasUnit === true) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), sql_1.ExpVal.num0));
        }
        selectUq.where(new sql_1.ExpAnd(...wheres));
        statements.push(selectUq);
        let select = factory.createSelect();
        statements.push(select);
        select
            .column(new sql_1.ExpVar('$id'), 'id')
            .column(new sql_1.ExpVar(vNewFlow), 'flow')
            .column(new sql_1.ExpVar('$preState'), 'preState')
            .column(new sql_1.ExpVar('$action'), 'action')
            .column(new sql_1.ExpVar('$state'), 'state')
            //.column(new ExpSelect(selectSheetTo), 'to')
            .column(new sql_1.ExpVar(vSheetApp), 'app')
            .column(new sql_1.ExpVar(vUq), 'uq')
            .column(new sql_1.ExpVar(vSheetNo), 'no')
            .column(new sql_1.ExpVar(vSheetUser), 'user')
            .column(new sql_1.ExpVar(vSheetDate), 'date')
            .column(new sql_1.ExpStr(sheet.name), 'name')
            .column(new sql_1.ExpVar(vSheetType), 'sheet')
            .column(new sql_1.ExpVar(vSheetVersion), 'version')
            .column(new sql_1.ExpVar(vSheetDiscription), 'discription')
            .column(sql_1.ExpVal.num0, 'processing');
        sqls.done(proc);
        statements.push(proc.createCommit());
    }
}
exports.BSheetAction = BSheetAction;
//# sourceMappingURL=sheet.js.map