import { BigInt, BizDetailActStatement, BizDetailActSubPend, BizDetailActSubBud, PendAct, PendValueCalc, SetEqu, IX } from "../../il";
import { EnumSysTable, sysTable } from "../dbContext";
import { ColVal, ExpAdd, ExpAnd, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpNeg, ExpNull, ExpNum, ExpStr, ExpSub, ExpVal, ExpVar } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

export class BBizDetailActStatement extends BStatement<BizDetailActStatement> {
    head(sqls: Sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.head(sqls);
    }
    body(sqls: Sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.body(sqls);
    }
    foot(sqls: Sqls): void {
        let bSub = this.istatement.sub.db(this.context);
        bSub.foot(sqls);
    }
}

export class BBizDetailActSubPend extends BStatement<BizDetailActSubPend> {
    // 可以发送sheet主表，也可以是Detail
    body(sqls: Sqls) {
        let { pend, valId, toVar, valDetailId, valValue, receiver, pendAct, valueCalc } = this.istatement;
        let { factory, varUnit, varUser } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Pend ';
        let declare = factory.createDeclare();
        sqls.push(declare);
        let { no } = this.istatement;
        let vId = 'id_' + no;
        let varId = new ExpVar(vId);
        let vBase = 'base_' + no;
        let varBase = new ExpVar(vBase);
        declare.var(vBase, new BigInt());
        declare.var(vId, new BigInt());
        let setBase = factory.createSet();
        sqls.push(setBase);
        setBase.equ(vBase, this.context.buildExpBudId(new ExpStr(pend.phrase)));
        switch (pendAct) {
            case PendAct.del:
                this.buildPendDel(sqls, varBase);
                return;
            case PendAct.goto:
                this.buildPendGoto(sqls, varBase);
                return;
        }

        let setId = factory.createSet();
        sqls.push(setId);
        if (valId === undefined) {
            setId.equ(vId,
                new ExpFuncInUq(
                    'pend$id'
                    , [varUnit, varUser, ExpNum.num1, ExpVal.null]
                    , true
                )
            );
            if (toVar !== undefined) {
                let setToVar = factory.createSet();
                sqls.push(setToVar);
                setToVar.equ(toVar.varName(), varId);
            }
        }
        else {
            setId.equ(vId, this.context.expVal(valId));
        }
        let update = factory.createUpdate();
        sqls.push(update);
        update.table = new EntityTable(EnumSysTable.pend, false);
        update.where = new ExpEQ(new ExpField('id'), varId);
        update.cols = [{ col: 'base', val: varBase }];
        let { cols } = update;
        if (valDetailId !== undefined) {
            cols.push({ col: 'detail', val: this.context.expVal(valDetailId) });
        }
        if (valValue !== undefined) {
            let expValueField = new ExpField('value');
            let expValue = this.context.expVal(valValue);
            let val: ExpVal;
            switch (valueCalc) {
                case PendValueCalc.equ: val = expValue; break;
                case PendValueCalc.add: val = new ExpAdd(expValueField, expValue); break;
                case PendValueCalc.sub: val = new ExpSub(expValueField, expValue); break;
            }
            cols.push({ col: 'value', val });
        }
    }

    private buildPendDel(sqls: Sqls, varBase: ExpVar) {
        let { valId, valDetailId } = this.istatement;
        let { factory } = this.context;
        let del = factory.createDelete();
        sqls.push(del);
        let a = 'a';
        del.from(new EntityTable(EnumSysTable.pend, false, a));
        del.tables = [a];
        let wheres = [new ExpEQ(new ExpField('base'), varBase)];
        if (valId !== undefined) {
            wheres.push(new ExpEQ(new ExpField('id', a), this.context.expVal(valId)));
        }
        if (valDetailId !== undefined) {
            wheres.push(new ExpEQ(new ExpField('id', a), this.context.expVal(valDetailId)));
        }
        del.where(new ExpAnd(...wheres));
    }

    private buildPendGoto(sqls: Sqls, varBase: ExpVar) {
        let { valId, valDetailId, pendGoto } = this.istatement;
        let { factory } = this.context;
        let update = factory.createUpdate();
        sqls.push(update);
        update.table = new EntityTable(EnumSysTable.pend, false);
        update.cols = [
            { col: 'base', val: this.context.buildExpBudId(new ExpStr(pendGoto.phrase)) }
        ];
        let wheres = [new ExpEQ(new ExpField('base'), varBase)];
        if (valId !== undefined) {
            wheres.push(new ExpEQ(new ExpField('id'), this.context.expVal(valId)));
        }
        if (valDetailId !== undefined) {
            wheres.push(new ExpEQ(new ExpField('id'), this.context.expVal(valDetailId)));
        }
        update.where = new ExpAnd(...wheres);
    }
}

const phraseId = '$phraseId_';
const objId = '$objId_';
const budId = '$budId_';
const historyId = '$history_';
export class BBizDetailActSubBud extends BStatement<BizDetailActSubBud> {
    head(sqls: Sqls): void {
        let { factory } = this.context;
        let { bud, no } = this.istatement;
        let { hasHistory } = bud;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(phraseId + no, new BigInt());
        declare.var(objId + no, new BigInt());
        if (hasHistory === true) {
            declare.var(budId + no, new BigInt());
            declare.var(historyId + no, new BigInt());
        }
    }
    body(sqls: Sqls) {
        let { setEqu, value, ref, bud, no, obj, toVar } = this.istatement;
        let { hasHistory, dataType, phrase, hasIndex: indexName } = bud;
        let { factory, varUnit, varUser } = this.context;
        let varPhraseId = phraseId + no;
        let varObjId = objId + no;
        let selectPhraseId = factory.createSelect();
        sqls.push(selectPhraseId);
        selectPhraseId.toVar = true;
        selectPhraseId.col('id', varPhraseId);
        selectPhraseId.from(sysTable(EnumSysTable.phrase));
        selectPhraseId.where(new ExpEQ(new ExpField('name'), new ExpStr(phrase)));
        const expObj = obj === undefined ? ExpNum.num0 : this.context.expVal(obj);
        const setObj = factory.createSet();
        sqls.push(setObj);
        setObj.equ(varObjId, expObj);
        const expValue = this.context.convertExp(value) as ExpVal;
        const expObjId = new ExpVar(varObjId);
        const expPhraseId = new ExpVar(varPhraseId);
        let table: EnumSysTable;
        switch (dataType) {
            default:
                table = EnumSysTable.ixBudInt;
                buildIxBudIndex();
                break;
            case 'char':
                table = EnumSysTable.ixBudStr;
                break;
            case 'dec':
                table = EnumSysTable.ixBudDec;
                break;
        }

        const expSite = new ExpVar('$site');
        const expUser = new ExpVar('$user');
        function buildIxBudIndex() {
            if (indexName === undefined) return;
            let upsert = factory.createUpsert();
            sqls.push(upsert);
            upsert.table = new EntityTable(EnumSysTable.ixBud, false);
            // -- VAR budSiteUomType ID = BudId($site, 'atom.uom.type');
            // -- VAR budSiteUomTypeValue ID = ID(Bud New KEY base=budSiteUomType, ext=type);
            const expBud = new ExpFuncInUq('bud$id'
                , [
                    expSite
                    , expUser
                    , ExpNum.num1
                    , new ExpFuncInUq('bud$id'
                        , [
                            expSite
                            , expUser
                            , ExpNum.num1
                            , expSite
                            , expPhraseId
                        ]
                        , true
                    )
                    , expValue
                ]
                , true);
            upsert.keys = [
                { col: 'i', val: expBud },
                { col: 'x', val: expObjId },
            ];
        }

        if (toVar !== undefined) {
            let selectToVar = factory.createSelect();
            sqls.push(selectToVar);
            selectToVar.toVar = true;
            selectToVar.column(new ExpField('value'), toVar.varName());
            selectToVar.from(new EntityTable(table, false));
            selectToVar.where(new ExpAnd(
                new ExpEQ(new ExpField('i'), expObjId),
                new ExpEQ(new ExpField('x'), expPhraseId),
            ));
            return;
        }

        let upsert = factory.createUpsert();
        sqls.push(upsert);
        upsert.table = sysTable(table);
        upsert.keys = [
            { col: 'i', val: expObjId },
            { col: 'x', val: expPhraseId },
        ];
        const valueCol = 'value';
        upsert.cols = [
            { col: valueCol, val: expValue, setEqu },
        ];

        if (hasHistory === true) {
            let expRef = this.context.convertExp(ref) as ExpVal;
            let vHistory = historyId + no;
            let vBudId = budId + no;
            let setHistoryId = factory.createSet();
            sqls.push(setHistoryId);
            setHistoryId.equ(vHistory, new ExpFunc('history$id', varUnit, varUser, ExpNum.num1, new ExpNull()));
            let setBudId = factory.createSet();
            sqls.push(setBudId);
            setBudId.equ(vBudId, new ExpFunc('bud$id', varUnit, varUser, ExpNum.num1, expObjId, expPhraseId));
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = sysTable(EnumSysTable.history);
            update.where = new ExpEQ(new ExpField('id'), new ExpVar(vHistory));
            let expPlusMinus: ExpVal;
            switch (setEqu) {
                default: debugger; throw new Error('unknown setEQU ' + setEqu);
                case SetEqu.add: expPlusMinus = ExpNum.num1; break;
                case SetEqu.sub: expPlusMinus = ExpNum.num_1; break;
                case SetEqu.equ: expPlusMinus = ExpNum.num0; break;
            }
            let cols: ColVal[] = [
                { col: 'bud', val: new ExpVar(vBudId) },
                { col: 'plusMinus', val: expPlusMinus },
            ];
            if (expValue !== undefined) {
                cols.push({ col: 'value', val: expValue });
            }
            if (expRef !== undefined) {
                cols.push({ col: 'ref', val: expRef });
            }
            update.cols = cols;
        }
    }
}
