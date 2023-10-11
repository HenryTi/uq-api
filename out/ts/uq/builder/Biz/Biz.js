"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBiz = void 0;
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const entity_1 = require("../entity/entity");
const BizBin_1 = require("./BizBin");
class BBiz extends entity_1.BEntity {
    constructor(context, entity) {
        super(context, entity);
        this.bDetails = [];
        for (let [, value] of this.entity.bizEntities) {
            switch (value.type) {
                /*
                case 'sheet':
                    let bBizSheet = new BBizSheetOld(this.context, value as BizSheetOld);
                    this.bSheets.push(bBizSheet);
                    break;
                */
                case 'detail':
                    let bBizDetail = new BizBin_1.BBizBin(this.context, value);
                    this.bDetails.push(bBizDetail);
                    break;
            }
        }
    }
    buildTables() {
        for (let bDetail of this.bDetails)
            bDetail.buildTables();
    }
    buildProcedures() {
        let procName = `$biz.sheet`;
        let proc = this.context.createProcedure(procName);
        let { appObjs } = this.context;
        appObjs.procedures.push(proc);
        this.buildBizSheetProc(proc);
        let procBizSheetAct = `$biz.sheet.act`;
        let procAct = this.context.createProcedure(procBizSheetAct);
        procAct.logError = true;
        appObjs.procedures.push(procAct);
        this.buildBizSheetActProc(procAct);
        for (let bDetail of this.bDetails)
            bDetail.buildProcedures();
    }
    buildBizSheetActProc(proc) {
        let { parameters, statements } = proc;
        let { factory, unitField, userParam } = this.context;
        const id = 'id';
        const detail = 'detail';
        const detailName = 'detailName';
        const detailValue = 'detailValue';
        const prev = 'prev';
        const actName = 'actName';
        const me = 'me';
        parameters.push(unitField);
        parameters.push(userParam);
        parameters.push((0, il_1.bigIntField)(id));
        parameters.push((0, il_1.charField)(detailName, 100));
        parameters.push((0, il_1.charField)(actName, 100));
        const varId = new sql_1.ExpVar(id);
        const varMe = new sql_1.ExpVar(me);
        const varDetailValue = new sql_1.ExpVar(detailValue);
        const varPrev = new sql_1.ExpVar(prev);
        const vProc = 'proc';
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var(me, new il_1.BigInt());
        declare.var(detail, new il_1.BigInt());
        declare.var(detailValue, new il_1.Dec(24, 8));
        declare.var(prev, new il_1.BigInt());
        declare.var(vProc, new il_1.Char(100));
        this.buildBiz$User(statements);
        let setMe = factory.createSet();
        statements.push(setMe);
        setMe.equ(me, new sql_1.ExpFuncInUq('me', [new sql_1.ExpVar(unitField.name), new sql_1.ExpVar(userParam.name)], true));
        statements.push(factory.createTransaction());
        statements.push(factory.createReturnBegin());
        let selectMy = factory.createSelect();
        selectMy.column(new sql_1.ExpField('i'));
        selectMy.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixState));
        selectMy.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), varMe), new sql_1.ExpEQ(new sql_1.ExpField('x'), varId)));
        let ifNone = factory.createIf();
        statements.push(ifNone);
        ifNone.cmp = new sql_1.ExpNot(new sql_1.ExpExists(selectMy));
        ifNone.then(factory.createReturn());
        // delete sheet temp
        let delTemp = factory.createDelete();
        statements.push(delTemp);
        delTemp.tables = ['b'];
        delTemp.from(new statementWithFrom_1.EntityTable('detail', false, 'a'))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable('temp', false, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', 'a'), new sql_1.ExpField('id', 'b')));
        delTemp.where(new sql_1.ExpEQ(new sql_1.ExpField('base', 'a'), varId));
        const varDetail = new sql_1.ExpVar(detail);
        let setDetail0 = factory.createSet();
        statements.push(setDetail0);
        setDetail0.equ(detail, sql_1.ExpNum.num0);
        let prepare = factory.createPrepare();
        statements.push(prepare);
        prepare.statementName = 'stmt';
        prepare.sql = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('call `'), new sql_1.ExpVar(detailName), new sql_1.ExpStr('.'), new sql_1.ExpVar(actName), new sql_1.ExpStr('`(?, ?, ?)'));
        let loop = factory.createWhile();
        statements.push(loop);
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
        let { statements: loopStatements } = loop;
        let setPrev = factory.createSet();
        loopStatements.add(setPrev);
        setPrev.equ(prev, varDetail);
        let setDetailId = factory.createSet();
        loopStatements.add(setDetailId);
        setDetailId.equ(detail, sql_1.ExpNull.null);
        let selectDetail = factory.createSelect();
        loopStatements.add(selectDetail);
        selectDetail.toVar = true;
        selectDetail.col('id', detail);
        selectDetail.col('value', detailValue);
        selectDetail.from(new statementWithFrom_1.EntityTable('detail', false));
        selectDetail.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('base'), varId), new sql_1.ExpGT(new sql_1.ExpField('id'), varPrev)));
        selectDetail.order(new sql_1.ExpField('id'), 'asc');
        selectDetail.limit(sql_1.ExpNum.num1);
        let ifBreak = factory.createIf();
        loopStatements.add(ifBreak);
        ifBreak.cmp = new sql_1.ExpOr(new sql_1.ExpIsNull(varDetail), new sql_1.ExpIsNull(varDetailValue), new sql_1.ExpEQ(varDetailValue, sql_1.ExpNum.num0));
        let leave = factory.createBreak();
        ifBreak.then(leave);
        leave.no = loop.no;
        let execute = factory.createExecutePrepare();
        loopStatements.add(execute);
        execute.statementName = 'stmt';
        execute.params = [
            new sql_1.ExpVar(unitField.name),
            new sql_1.ExpVar(userParam.name),
            varDetail,
        ];
        let deallocatePrepare = factory.createDeallocatePrepare();
        statements.push(deallocatePrepare);
        deallocatePrepare.statementName = 'stmt';
        let delMyDraft = factory.createDelete();
        statements.push(delMyDraft);
        delMyDraft.tables = ['a'];
        delMyDraft.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixState, 'a'));
        delMyDraft.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', 'a'), varMe), new sql_1.ExpEQ(new sql_1.ExpField('x', 'a'), varId)));
        // 已记账单据归档
        let archive = factory.createUpsert();
        statements.push(archive);
        let selectBase = factory.createSelect();
        selectBase.col('id');
        selectBase.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.sheet));
        selectBase.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), varId));
        archive.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixState);
        archive.keys = [
            { col: 'i', val: new sql_1.ExpSelect(selectBase) },
            { col: 'x', val: varId },
        ];
        statements.push(factory.createReturnEnd());
        let selectTemp = factory.createSelect();
        statements.push(selectTemp);
        selectTemp.col('id', undefined, 'b');
        selectTemp.col('value', undefined, 'b');
        selectTemp.from(new statementWithFrom_1.EntityTable('detail', false, 'a'))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable('temp', false, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', 'a'), new sql_1.ExpField('id', 'b')));
        selectTemp.where(new sql_1.ExpEQ(new sql_1.ExpField('base', 'a'), varId));
        statements.push(factory.createCommit());
    }
    buildBizSheetProc(proc) {
        let { parameters, statements } = proc;
        let { factory, unitField, userParam } = this.context;
        parameters.push(unitField);
        parameters.push(userParam);
        parameters.push((0, il_1.bigIntField)('id'));
        parameters.push((0, il_1.charField)('act', 100));
        const expId = new sql_1.ExpVar('id');
        const vProc = 'proc';
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('state', new il_1.Char(200));
        declare.var(vProc, new il_1.Char(100));
        let selectSheet = factory.createSelect();
        selectSheet.toVar = true;
        selectSheet.col('name', 'state', 'c');
        selectSheet
            .from(new statementWithFrom_1.EntityTable('sheet', false, 'a'))
            .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.bud, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('base', 'a'), new sql_1.ExpField('id', 'b')))
            .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.phrase, 'c'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('phrase', 'b'), new sql_1.ExpField('id', 'c')));
        selectSheet.where(new sql_1.ExpEQ(new sql_1.ExpField('id', 'a'), expId));
        let selectState = factory.createSelect();
        selectState.toVar = true;
        selectState
            .col('name', 'state', 'c')
            .from(new statementWithFrom_1.EntityTable('ixstatesheet', false, 'a'))
            .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.bud, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('ix', 'a'), new sql_1.ExpField('id', 'b')))
            .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.phrase, 'c'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', 'c'), new sql_1.ExpField('phrase', 'b')))
            .where(new sql_1.ExpField('xi', 'a'));
        let selectMy = factory.createSelect();
        selectMy.column(new sql_1.ExpField('i'));
        selectMy.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixState));
        selectMy.where(new sql_1.ExpEQ(new sql_1.ExpField('x'), expId));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpExists(selectMy);
        iff.then(selectSheet);
        let setProc = factory.createSet();
        iff.then(setProc);
        setProc.equ(vProc, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpFunc(factory.func_substring_index, new sql_1.ExpVar('state'), new sql_1.ExpStr('.'), new sql_1.ExpNum(-1)), new sql_1.ExpStr('.$start.$act')));
        iff.else(selectState);
        let setProcState = factory.createSet();
        iff.else(setProcState);
        setProcState.equ(vProc, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpFunc(factory.func_substring_index, new sql_1.ExpVar('state'), new sql_1.ExpStr('.'), new sql_1.ExpNum(-2)), new sql_1.ExpStr('.'), new sql_1.ExpVar('act')));
        // call the proc
        let ifProc = factory.createIf();
        statements.push(ifProc);
        ifProc.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(vProc));
        let ifProcBuilt = factory.createIf();
        ifProc.then(ifProcBuilt);
        let selectProc = factory.createSelect();
        ifProcBuilt.cmp = new sql_1.ExpExists(selectProc);
        selectProc.col('changed')
            .from(new statementWithFrom_1.EntityTable('$proc', false))
            .where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar(vProc)), new sql_1.ExpEQ(new sql_1.ExpField('changed'), sql_1.ExpNum.num0)));
        let execSql = factory.createExecSql();
        ifProcBuilt.then(execSql);
        execSql.sql = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('call `'), new sql_1.ExpVar(vProc), new sql_1.ExpStr('`('), new sql_1.ExpVar('$unit'), new sql_1.ExpStr(','), new sql_1.ExpVar('$user'), new sql_1.ExpStr(','), expId, new sql_1.ExpStr(');'));
        let selectRet = factory.createSelect();
        ifProcBuilt.else(selectRet);
        selectRet.column(new sql_1.ExpVar(vProc), vProc);
    }
}
exports.BBiz = BBiz;
//# sourceMappingURL=Biz.js.map