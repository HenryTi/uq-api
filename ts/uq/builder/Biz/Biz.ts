import {
    BigInt, bigIntField, Biz, BizBase, BizDetail, BizSpec
    , Char, charField, Dec, intField, JoinType, Text
} from "../../il";
import { DbContext, EnumSysTable, sysTable } from "../dbContext";
import {
    ColVal,
    ExpAdd,
    ExpAnd, ExpEQ, ExpExists, ExpField, ExpFunc
    , ExpFuncInUq, ExpGT, ExpIsNotNull, ExpIsNull, ExpLE, ExpNot, ExpNull, ExpNum, ExpOr, ExpSelect, ExpStr, ExpSub, ExpVal, ExpVar
    , Procedure,
    Statements,
    Update
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BEntity } from "../entity/entity";
import { BBizDetail } from "./BizDetail";
import { BBizSpec } from "./BizSpec";

export class BBiz extends BEntity<Biz> {
    protected readonly bDetails: BBizDetail[];
    protected readonly bSpecs: BBizSpec[];
    constructor(context: DbContext, entity: Biz) {
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
                    let bBizDetail = new BBizDetail(this.context, value as BizDetail);
                    this.bDetails.push(bBizDetail);
                    break;
                case 'spec':
                    let bBizSpec = new BBizSpec(this.context, value as BizSpec);
                    this.bSpecs.push(bBizSpec);
            }
        }
    }

    buildTables() {
        // for (let bSheet of this.bSheets) bSheet.buildTables();
        for (let bDetail of this.bDetails) bDetail.buildTables();
        for (let bSpec of this.bSpecs) bSpec.buildTables();
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

        let funcSpecValue = this.context.createFunction('specvalue', new Text());
        appObjs.procedures.push(funcSpecValue);
        this.buildSpecValueFunction(funcSpecValue);

        let funcSpecId = this.context.createFunction('specid', new BigInt());
        appObjs.procedures.push(funcSpecId);
        this.buildSpecIdFunction(funcSpecId);

        // for (let bSheet of this.bSheets) bSheet.buildProcedures();
        for (let bDetail of this.bDetails) bDetail.buildProcedures();
        for (let bSpec of this.bSpecs) bSpec.buildProcedures();
    }

    private buildBizSheetActProc(proc: Procedure) {
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
        parameters.push(bigIntField(id));
        parameters.push(charField(detailName, 100));
        parameters.push(charField(actName, 100));

        const varId = new ExpVar(id);
        const varMe = new ExpVar(me);
        const varDetailValue = new ExpVar(detailValue);
        const varPrev = new ExpVar(prev);
        const vProc = 'proc';
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var(me, new BigInt());
        declare.var(detail, new BigInt());
        declare.var(detailValue, new Dec(24, 8));
        declare.var(prev, new BigInt());
        declare.var(vProc, new Char(100));

        this.buildBiz$User(statements);
        let setMe = factory.createSet();
        statements.push(setMe);
        setMe.equ(me, new ExpFuncInUq('me', [new ExpVar(unitField.name), new ExpVar(userParam.name)], true));

        statements.push(factory.createTransaction());
        statements.push(factory.createReturnBegin());

        let selectMy = factory.createSelect();
        selectMy.column(new ExpField('i'));
        selectMy.from(sysTable(EnumSysTable.ixMy));
        selectMy.where(new ExpAnd(
            new ExpEQ(new ExpField('i'), varMe),
            new ExpEQ(new ExpField('x'), varId)
        ));

        let ifNone = factory.createIf();
        statements.push(ifNone);
        ifNone.cmp = new ExpNot(new ExpExists(selectMy));
        ifNone.then(factory.createReturn());

        // delete sheet temp
        let delTemp = factory.createDelete();
        statements.push(delTemp);
        delTemp.tables = ['b'];
        delTemp.from(new EntityTable('detail', false, 'a'))
            .join(JoinType.join, new EntityTable('temp', false, 'b'))
            .on(new ExpEQ(new ExpField('id', 'a'), new ExpField('id', 'b')));
        delTemp.where(new ExpEQ(new ExpField('base', 'a'), varId));

        const varDetail = new ExpVar(detail);
        let setDetail0 = factory.createSet();
        statements.push(setDetail0);
        setDetail0.equ(detail, ExpNum.num0);

        let prepare = factory.createPrepare();
        statements.push(prepare);
        prepare.statementName = 'stmt';
        prepare.sql = new ExpFunc(factory.func_concat
            , new ExpStr('call `')
            , new ExpVar(detailName)
            , new ExpStr('.')
            , new ExpVar(actName)
            , new ExpStr('`(?, ?, ?)')
        );

        let loop = factory.createWhile();
        statements.push(loop);
        loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);

        let { statements: loopStatements } = loop;
        let setPrev = factory.createSet();
        loopStatements.add(setPrev);
        setPrev.equ(prev, varDetail);

        let setDetailId = factory.createSet();
        loopStatements.add(setDetailId);
        setDetailId.equ(detail, ExpNull.null);

        let selectDetail = factory.createSelect();
        loopStatements.add(selectDetail);
        selectDetail.toVar = true;
        selectDetail.col('id', detail);
        selectDetail.col('value', detailValue);
        selectDetail.from(new EntityTable('detail', false));
        selectDetail.where(new ExpAnd(
            new ExpEQ(new ExpField('base'), varId),
            new ExpGT(new ExpField('id'), varPrev),
        ));
        selectDetail.order(new ExpField('id'), 'asc');
        selectDetail.limit(ExpNum.num1);

        let ifBreak = factory.createIf();
        loopStatements.add(ifBreak);
        ifBreak.cmp = new ExpOr(
            new ExpIsNull(varDetail)
            , new ExpIsNull(varDetailValue)
            , new ExpEQ(varDetailValue, ExpNum.num0)
        );
        let leave = factory.createBreak();
        ifBreak.then(leave);
        leave.no = loop.no;

        let execute = factory.createExecutePrepare();
        loopStatements.add(execute);
        execute.statementName = 'stmt';
        execute.params = [
            new ExpVar(unitField.name),
            new ExpVar(userParam.name),
            varDetail,
        ];

        let deallocatePrepare = factory.createDeallocatePrepare();
        statements.push(deallocatePrepare);
        deallocatePrepare.statementName = 'stmt';

        let delMyDraft = factory.createDelete();
        statements.push(delMyDraft);
        delMyDraft.tables = ['a'];
        delMyDraft.from(sysTable(EnumSysTable.ixMy, 'a'));
        delMyDraft.where(new ExpAnd(
            new ExpEQ(new ExpField('i', 'a'), varMe),
            new ExpEQ(new ExpField('x', 'a'), varId)
        ));

        statements.push(factory.createReturnEnd());

        let selectTemp = factory.createSelect();
        statements.push(selectTemp);
        selectTemp.col('id', undefined, 'b');
        selectTemp.col('value', undefined, 'b');
        selectTemp.from(new EntityTable('detail', false, 'a'))
            .join(JoinType.join, new EntityTable('temp', false, 'b'))
            .on(new ExpEQ(new ExpField('id', 'a'), new ExpField('id', 'b')));
        selectTemp.where(new ExpEQ(new ExpField('base', 'a'), varId));

        statements.push(factory.createCommit());
    }

    private buildBizSheetProc(proc: Procedure) {
        let { parameters, statements } = proc;
        let { factory, unitField, userParam } = this.context;
        parameters.push(unitField);
        parameters.push(userParam);
        parameters.push(bigIntField('id'));
        parameters.push(charField('act', 100));

        const expId = new ExpVar('id');
        const vProc = 'proc';
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('state', new Char(200));
        declare.var(vProc, new Char(100));

        let selectSheet = factory.createSelect();
        selectSheet.toVar = true;
        selectSheet.col('name', 'state', 'c');
        selectSheet
            .from(new EntityTable('sheet', false, 'a'))
            .join(JoinType.join, sysTable(EnumSysTable.bud, 'b'))
            .on(new ExpEQ(new ExpField('base', 'a'), new ExpField('id', 'b')))
            .join(JoinType.join, sysTable(EnumSysTable.phrase, 'c'))
            .on(new ExpEQ(new ExpField('phrase', 'b'), new ExpField('id', 'c')));
        selectSheet.where(new ExpEQ(new ExpField('id', 'a'), expId));

        let selectState = factory.createSelect();
        selectState.toVar = true;
        selectState
            .col('name', 'state', 'c')
            .from(new EntityTable('ixstatesheet', false, 'a'))
            .join(JoinType.join, sysTable(EnumSysTable.bud, 'b'))
            .on(new ExpEQ(new ExpField('ix', 'a'), new ExpField('id', 'b')))
            .join(JoinType.join, sysTable(EnumSysTable.phrase, 'c'))
            .on(new ExpEQ(new ExpField('id', 'c'), new ExpField('phrase', 'b')))
            .where(new ExpField('xi', 'a'));

        let selectMy = factory.createSelect();
        selectMy.column(new ExpField('i'));
        selectMy.from(sysTable(EnumSysTable.ixMy));
        selectMy.where(new ExpEQ(new ExpField('x'), expId));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpExists(selectMy);
        iff.then(selectSheet);
        let setProc = factory.createSet();
        iff.then(setProc);
        setProc.equ(vProc, new ExpFunc(
            factory.func_concat,
            new ExpFunc(factory.func_substring_index, new ExpVar('state'), new ExpStr('.'), new ExpNum(-1)),
            new ExpStr('.$start.$act')
        ));

        iff.else(selectState);
        let setProcState = factory.createSet();
        iff.else(setProcState);
        setProcState.equ(vProc,
            new ExpFunc(factory.func_concat,
                new ExpFunc(factory.func_substring_index, new ExpVar('state'), new ExpStr('.'), new ExpNum(-2)),
                new ExpStr('.'),
                new ExpVar('act'),
            )
        );

        // call the proc
        let ifProc = factory.createIf();
        statements.push(ifProc);
        ifProc.cmp = new ExpIsNotNull(new ExpVar(vProc));
        let ifProcBuilt = factory.createIf();
        ifProc.then(ifProcBuilt);
        let selectProc = factory.createSelect();
        ifProcBuilt.cmp = new ExpExists(selectProc);
        selectProc.col('changed')
            .from(new EntityTable('$proc', false))
            .where(new ExpAnd(
                new ExpEQ(new ExpField('name'), new ExpVar(vProc)),
                new ExpEQ(new ExpField('changed'), ExpNum.num0)
            ));

        let execSql = factory.createExecSql();
        ifProcBuilt.then(execSql);
        execSql.sql = new ExpFunc(factory.func_concat,
            new ExpStr('call `'), new ExpVar(vProc), new ExpStr('`('),
            new ExpVar('$unit'), new ExpStr(','),
            new ExpVar('$user'), new ExpStr(','),
            expId,
            new ExpStr(');')
        );

        let selectRet = factory.createSelect();
        ifProcBuilt.else(selectRet);
        selectRet.column(new ExpVar(vProc), vProc);
    }

    private buildSpecValueFunction(proc: Procedure): void {
        const { parameters, statements } = proc;
        parameters.push(
            bigIntField('id'),
        );

        let { factory } = this.context;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            charField('ret', 500),
            charField('entity', 100),
            charField('sep', 10),
        );
        const varEntity = new ExpVar('entity');
        const varSep = new ExpVar('sep');
        let selectEntity = factory.createSelect();
        statements.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(new ExpFunc('char', new ExpNum(12)), 'sep');
        selectEntity.column(new ExpField('name', 'b'), 'entity');
        selectEntity.from(sysTable(EnumSysTable.id_u, 'a'))
            .join(JoinType.join, sysTable(EnumSysTable.entity, 'b'))
            .on(new ExpEQ(new ExpField('entity', 'a'), new ExpField('id', 'b')));
        selectEntity.where(new ExpEQ(new ExpField('id', 'a'), new ExpVar('id')));

        let first = true;
        let iff = factory.createIf();
        for (let [, value] of this.entity.bizEntities) {
            let { type } = value;
            if (type !== 'spec') continue;
            let { name } = value;
            let specName = 'spec$' + name;
            let cmp = new ExpEQ(varEntity, new ExpStr(name));
            let select = factory.createSelect();
            select.toVar = true;
            let cols: ExpVal[] = this.buildBizSpecCols(value as BizSpec);
            select.column(new ExpFunc(factory.func_concat_ws, varSep, ...cols), 'ret');
            select.from(new EntityTable(specName, false));
            select.where(new ExpEQ(new ExpField('id'), new ExpVar('id')));

            if (first === true) {
                first = false;
                iff.cmp = cmp;
                iff.then(select);
            }
            else {
                let elseStats = new Statements();
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

    private buildBizSpecCols(bizSpec: BizSpec): ExpVal[] {
        let ret: ExpVal[] = [];
        let { keys, props } = bizSpec;
        for (let [, value] of keys) {
            ret.push(new ExpField(value.name));
        }
        for (let [, value] of props) {
            ret.push(new ExpField(value.name));
        }
        return ret;
    }

    private buildSpecIdFunction(proc: Procedure): void {
        const { factory } = this.context;
        const { parameters, statements } = proc;
        parameters.push(
            charField('spec', 100),
            bigIntField('atom'),
            charField('values', 200),
        );

        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            bigIntField('id'),
            charField('v1', 200),
            charField('v2', 200),
            charField('v3', 200),
            charField('v4', 200),
            intField('p'),
            intField('c'),
            intField('len'),
            charField('sep', 10),
        );

        const varSep = new ExpVar('sep');
        const varP = new ExpVar('p');
        const varC = new ExpVar('c');
        const varValues = new ExpVar('values');
        const varLen = new ExpVar('len');
        const varSpec = new ExpVar('spec');

        let setSep = factory.createSet();
        statements.push(setSep);
        setSep.equ('sep', new ExpFunc('char', new ExpNum(12)));

        let setReplateChar12 = factory.createSet();
        statements.push(setReplateChar12);
        setReplateChar12.equ('values', new ExpFunc('replace', varValues, new ExpStr('\\\\f'), new ExpFunc('char', new ExpNum(12))));

        let setLen = factory.createSet();
        statements.push(setLen);
        setLen.equ('len', new ExpFunc(factory.func_length, varValues));

        let setP1 = factory.createSet();
        statements.push(setP1);
        setP1.equ('p', ExpNum.num1);

        let cmp = new ExpGT(varC, ExpNum.num0);
        let expSeg = new ExpFunc(factory.func_substr, varValues, varP, new ExpSub(varC, varP));
        let expEnd = new ExpFunc(factory.func_substr, varValues, varP);

        let setP = factory.createSet();
        setP.equ('p', new ExpAdd(varC, ExpNum.num1));

        let setC = factory.createSet();
        statements.push(setC);
        setC.equ('c', new ExpFunc(factory.func_charindex, varSep, varValues, varP));

        function createIff(vn: number) {
            let v = 'v' + vn;
            let iff = factory.createIf();
            iff.cmp = cmp;
            let setV = factory.createSet();
            iff.then(setV);
            setV.equ(v, expSeg);
            iff.then(setP);
            iff.then(setC);
            let setVEnd = factory.createSet()
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
            if (type !== 'spec') continue;
            let { name } = value;
            let cmp = new ExpEQ(varSpec, new ExpStr(name));
            let set = factory.createSet();
            let bizSpec = value as BizSpec;
            let params: ExpVal[] = this.buildBizSpecKeys(bizSpec);
            let specName = `spec$${name}$id`;
            set.equ('id', new ExpFunc(specName, ExpNum.num1, new ExpVar('atom'), ...params));
            let update = this.buildBizSpecUpdate(bizSpec);
            if (first === true) {
                first = false;
                iff.cmp = cmp;
                iff.then(set);
                iff.then(update);
            }
            else {
                let elseStats = new Statements();
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

    private buildBizSpecKeys(bizSpec: BizSpec): ExpVal[] {
        let ret: ExpVal[] = [];
        let { keys } = bizSpec;
        let i = 1;
        for (let [, value] of keys) {
            ret.push(new ExpVar('v' + i));
            i++;
        }
        return ret;
    }

    private buildBizSpecUpdate(bizSpec: BizSpec): Update {
        let { keys, props } = bizSpec;
        if (props.size === 0) return;
        let update = this.context.factory.createUpdate();
        update.where = new ExpEQ(new ExpField('id'), new ExpVar('id'));
        update.table = new EntityTable('spec$' + bizSpec.name, false);
        let i = keys.size + 1;
        let cols: ColVal[] = [];
        for (let [, value] of props) {
            cols.push({
                col: value.name,
                val: new ExpVar('v' + i),
            });
            i++;
        }
        update.cols = cols;
        return update;
    }
}
