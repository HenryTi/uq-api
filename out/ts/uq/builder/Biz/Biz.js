"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBiz = void 0;
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const entity_1 = require("../entity/entity");
const BizDetail_1 = require("./BizDetail");
const BizSpec_1 = require("./BizSpec");
class BBiz extends entity_1.BEntity {
    constructor(context, entity) {
        super(context, entity);
        // this.bSheets = [];
        this.bDetails = [];
        this.bSpecs = [];
        for (let [, value] of this.entity.bizEntities) {
            switch (value.type) {
                /*
                case 'sheet':
                    let bBizSheet = new BBizSheetOld(this.context, value as BizSheetOld);
                    this.bSheets.push(bBizSheet);
                    break;
                */
                case 'detail':
                    let bBizDetail = new BizDetail_1.BBizDetail(this.context, value);
                    this.bDetails.push(bBizDetail);
                    break;
                case 'spec':
                    let bBizSpec = new BizSpec_1.BBizSpec(this.context, value);
                    this.bSpecs.push(bBizSpec);
            }
        }
    }
    buildTables() {
        // for (let bSheet of this.bSheets) bSheet.buildTables();
        for (let bDetail of this.bDetails)
            bDetail.buildTables();
        for (let bSpec of this.bSpecs)
            bSpec.buildTables();
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
        let funcSpecValue = this.context.createFunction('specvalue', new il_1.Text());
        appObjs.procedures.push(funcSpecValue);
        this.buildSpecValueFunction(funcSpecValue);
        let funcSpecId = this.context.createFunction('specid', new il_1.BigInt());
        appObjs.procedures.push(funcSpecId);
        this.buildSpecIdFunction(funcSpecId);
        // for (let bSheet of this.bSheets) bSheet.buildProcedures();
        for (let bDetail of this.bDetails)
            bDetail.buildProcedures();
        for (let bSpec of this.bSpecs)
            bSpec.buildProcedures();
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
        selectMy.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixMy));
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
        delMyDraft.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixMy, 'a'));
        delMyDraft.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', 'a'), varMe), new sql_1.ExpEQ(new sql_1.ExpField('x', 'a'), varId)));
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
        selectMy.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixMy));
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
    buildSpecValueFunction(proc) {
        const { parameters, statements } = proc;
        parameters.push((0, il_1.bigIntField)('id'));
        let { factory } = this.context;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.charField)('ret', 500), (0, il_1.charField)('entity', 100), (0, il_1.charField)('sep', 10));
        const varEntity = new sql_1.ExpVar('entity');
        const varSep = new sql_1.ExpVar('sep');
        let selectEntity = factory.createSelect();
        statements.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(new sql_1.ExpFunc('char', new sql_1.ExpNum(12)), 'sep');
        selectEntity.column(new sql_1.ExpField('name', 'b'), 'entity');
        selectEntity.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.id_u, 'a'))
            .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('entity', 'a'), new sql_1.ExpField('id', 'b')));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('id', 'a'), new sql_1.ExpVar('id')));
        let first = true;
        let iff = factory.createIf();
        for (let [, value] of this.entity.bizEntities) {
            let { type } = value;
            if (type !== 'spec')
                continue;
            let { name } = value;
            let specName = 'spec$' + name;
            let cmp = new sql_1.ExpEQ(varEntity, new sql_1.ExpStr(name));
            let select = factory.createSelect();
            select.toVar = true;
            let cols = this.buildBizSpecCols(value);
            select.column(new sql_1.ExpFunc(factory.func_concat_ws, varSep, ...cols), 'ret');
            select.from(new statementWithFrom_1.EntityTable(specName, false));
            select.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')));
            if (first === true) {
                first = false;
                iff.cmp = cmp;
                iff.then(select);
            }
            else {
                let elseStats = new sql_1.Statements();
                elseStats.add(select);
                iff.elseIf(cmp, elseStats);
            }
        }
        if (iff.cmp !== undefined) {
            statements.push(iff);
        }
        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'ret';
    }
    buildBizSpecCols(bizSpec) {
        let ret = [];
        let { keys, props } = bizSpec;
        for (let [, value] of keys) {
            ret.push(new sql_1.ExpField(value.name));
        }
        for (let [, value] of props) {
            ret.push(new sql_1.ExpField(value.name));
        }
        return ret;
    }
    buildSpecIdFunction(proc) {
        const { factory } = this.context;
        const { parameters, statements } = proc;
        parameters.push((0, il_1.charField)('spec', 100), (0, il_1.bigIntField)('atom'), (0, il_1.charField)('values', 200));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)('id'), (0, il_1.charField)('v1', 200), (0, il_1.charField)('v2', 200), (0, il_1.charField)('v3', 200), (0, il_1.charField)('v4', 200), (0, il_1.intField)('p'), (0, il_1.intField)('c'), (0, il_1.intField)('len'), (0, il_1.charField)('sep', 10));
        const varSep = new sql_1.ExpVar('sep');
        const varP = new sql_1.ExpVar('p');
        const varC = new sql_1.ExpVar('c');
        const varValues = new sql_1.ExpVar('values');
        const varLen = new sql_1.ExpVar('len');
        const varSpec = new sql_1.ExpVar('spec');
        let setSep = factory.createSet();
        statements.push(setSep);
        setSep.equ('sep', new sql_1.ExpFunc('char', new sql_1.ExpNum(12)));
        let setReplateChar12 = factory.createSet();
        statements.push(setReplateChar12);
        setReplateChar12.equ('values', new sql_1.ExpFunc('replace', varValues, new sql_1.ExpStr('\\\\f'), new sql_1.ExpFunc('char', new sql_1.ExpNum(12))));
        let setLen = factory.createSet();
        statements.push(setLen);
        setLen.equ('len', new sql_1.ExpFunc(factory.func_length, varValues));
        let setP1 = factory.createSet();
        statements.push(setP1);
        setP1.equ('p', sql_1.ExpNum.num1);
        let cmp = new sql_1.ExpGT(varC, sql_1.ExpNum.num0);
        let expSeg = new sql_1.ExpFunc(factory.func_substr, varValues, varP, new sql_1.ExpSub(varC, varP));
        let expEnd = new sql_1.ExpFunc(factory.func_substr, varValues, varP);
        let setP = factory.createSet();
        setP.equ('p', new sql_1.ExpAdd(varC, sql_1.ExpNum.num1));
        let setC = factory.createSet();
        statements.push(setC);
        setC.equ('c', new sql_1.ExpFunc(factory.func_charindex, varSep, varValues, varP));
        function createIff(vn) {
            let v = 'v' + vn;
            let iff = factory.createIf();
            iff.cmp = cmp;
            let setV = factory.createSet();
            iff.then(setV);
            setV.equ(v, expSeg);
            iff.then(setP);
            iff.then(setC);
            let setVEnd = factory.createSet();
            iff.else(setVEnd);
            setVEnd.equ(v, expEnd);
            return iff;
        }
        let iff1 = createIff(1);
        statements.push(iff1);
        let iff2 = createIff(2);
        iff1.then(iff2);
        let iff3 = createIff(3);
        iff2.then(iff3);
        let iff4 = createIff(4);
        iff3.then(iff4);
        let first = true;
        let iff = factory.createIf();
        for (let [, value] of this.entity.bizEntities) {
            let { type } = value;
            if (type !== 'spec')
                continue;
            let { name } = value;
            let cmp = new sql_1.ExpEQ(varSpec, new sql_1.ExpStr(name));
            let set = factory.createSet();
            let bizSpec = value;
            let params = this.buildBizSpecKeys(bizSpec);
            let specName = `spec$${name}$id`;
            set.equ('id', new sql_1.ExpFunc(specName, sql_1.ExpNum.num1, new sql_1.ExpVar('atom'), ...params));
            let update = this.buildBizSpecUpdate(bizSpec);
            if (first === true) {
                first = false;
                iff.cmp = cmp;
                iff.then(set);
                iff.then(update);
            }
            else {
                let elseStats = new sql_1.Statements();
                elseStats.add(set);
                elseStats.add(update);
                iff.elseIf(cmp, elseStats);
            }
        }
        if (iff.cmp !== undefined) {
            statements.push(iff);
        }
        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'id';
    }
    buildBizSpecKeys(bizSpec) {
        let ret = [];
        let { keys } = bizSpec;
        let i = 1;
        for (let [, value] of keys) {
            ret.push(new sql_1.ExpVar('v' + i));
            i++;
        }
        return ret;
    }
    buildBizSpecUpdate(bizSpec) {
        let { keys, props } = bizSpec;
        if (props.size === 0)
            return;
        let update = this.context.factory.createUpdate();
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id'));
        update.table = new statementWithFrom_1.EntityTable('spec$' + bizSpec.name, false);
        let i = keys.size + 1;
        let cols = [];
        for (let [, value] of props) {
            cols.push({
                col: value.name,
                val: new sql_1.ExpVar('v' + i),
            });
            i++;
        }
        update.cols = cols;
        return update;
    }
}
exports.BBiz = BBiz;
//# sourceMappingURL=Biz.js.map