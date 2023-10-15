import {
    BigInt, bigIntField, Biz, BizBase, BizBin
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

export class BBiz extends BEntity<Biz> {
    // protected readonly bDetails: BBizBin[];
    constructor(context: DbContext, entity: Biz) {
        super(context, entity);
        // this.bDetails = [];
        for (let [, value] of this.entity.bizEntities) {
            switch (value.type) {
                /*
                case 'sheet':
                    let bBizSheet = new BBizSheetOld(this.context, value as BizSheetOld);
                    this.bSheets.push(bBizSheet);
                    break;
                */
                // case 'detail':
                //let bBizDetail = new BBizBin(this.context, value as BizBin);
                //this.bDetails.push(bBizDetail);
                //break;
            }
        }
    }

    buildTables() {
        // for (let bDetail of this.bDetails) bDetail.buildTables();
    }

    buildProcedures() {
        /*
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

        for (let bDetail of this.bDetails) bDetail.buildProcedures();
        */
    }
    /*
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
            selectMy.from(sysTable(EnumSysTable.ixState));
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
            delMyDraft.from(sysTable(EnumSysTable.ixState, 'a'));
            delMyDraft.where(new ExpAnd(
                new ExpEQ(new ExpField('i', 'a'), varMe),
                new ExpEQ(new ExpField('x', 'a'), varId)
            ));
    
            // 已记账单据归档
            let archive = factory.createUpsert();
            statements.push(archive);
            let selectBase = factory.createSelect();
            selectBase.col('id');
            selectBase.from(sysTable(EnumSysTable.sheet));
            selectBase.where(new ExpEQ(new ExpField('id'), varId));
            archive.table = sysTable(EnumSysTable.ixState);
            archive.keys = [
                { col: 'i', val: new ExpSelect(selectBase) },
                { col: 'x', val: varId },
            ];
    
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
            selectMy.from(sysTable(EnumSysTable.ixState));
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
    */
}
