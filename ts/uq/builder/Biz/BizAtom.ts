import {
    BigInt, BizSpec, BizBudValue, BudDataType, Char, DataType, Dec, JoinType
    , JsonDataType, bigIntField, idField, jsonField, EnumSysTable, BizBud, BizAtom, IDUnique
} from "../../il";
import {
    ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpIn, ExpIsNotNull, ExpIsNull, ExpNull, ExpNum
    , ExpOr, ExpSelect, ExpStr, ExpVal, ExpVar, Procedure
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizAtom extends BBizEntity<BizAtom> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures
        const { id, uniques } = this.bizEntity;
        if (uniques !== undefined) {
            const budUniques: Map<BizBud, IDUnique[]> = new Map();
            for (let uq of uniques) {
                const { keys, no } = uq;
                function addBudUniques(bud: BizBud) {
                    let bu = budUniques.get(bud);
                    if (bu === undefined) {
                        bu = [uq];
                        budUniques.set(bud, bu);
                    }
                    else bu.push(uq);
                }
                for (let key of keys) addBudUniques(key);
                addBudUniques(no);
            }
            for (let [bud, unique] of budUniques) {
                const procUnqiue = this.createProcedure(`${this.context.site}.${bud.id}bu`);
                this.buildBudUniqueProc(procUnqiue, bud, unique);
            }
            // const procUnqiue = this.createProcedure(`${this.context.site}.${id}u`);
            // this.buildUniqueProc(procUnqiue);
        }
    }

    private buildBudUniqueProc(proc: Procedure, bud: BizBud, uniqueArr: IDUnique[]) {
        const { parameters, statements } = proc;
        const { factory } = this.context;

        //const cBase = '$base';
        const cId = '$id';
        const a = 'a';
        //const site = '$site';
        //const budPhrase = '$budPhrase';
        let varBudPhrase = new ExpNum(bud.id);
        let varAtomPhrase = new ExpNum(this.bizEntity.id);

        parameters.push(
            //bigIntField(site),
            bigIntField(cId),
            //bigIntField(cBase),
            //bigIntField(budPhrase),
        );

        const declare = factory.createDeclare();
        statements.push(declare);

        function buildUnique(unique: IDUnique) {
            const { name, keys, no } = unique;
            let vKey = `${name}_key`;
            let vNo = `${name}_no`;
            let vI = `${name}_i`;
            declare.var(vKey, new BigInt());
            declare.var(vNo, new Char(400));
            declare.var(vI, new BigInt());
            let noNullCmp: ExpCmp;
            let valKey: ExpVal;
            if (keys.length > 0) {
                let setKey = factory.createSet();
                statements.push(setKey);
                let selectKey = factory.createSelect();
                selectKey.col('value');
                selectKey.from(new EntityTable(EnumSysTable.ixBudInt, false));
                selectKey.where(new ExpAnd(
                    new ExpEQ(new ExpField('i'), new ExpVar(cId)),
                    new ExpEQ(new ExpField('x'), new ExpNum(keys[0].id)),
                ));
                setKey.equ(vKey, new ExpSelect(selectKey));
                noNullCmp = new ExpAnd(
                    new ExpIsNotNull(new ExpVar(vKey)),
                    new ExpIsNotNull(new ExpVar(vNo)),
                );
                valKey = new ExpFuncInUq('bud$id', [
                    ExpNull.null, ExpNull.null, ExpNum.num1, ExpNull.null,
                    varAtomPhrase, new ExpVar(vKey)
                ], true);
            }
            else {
                noNullCmp = new ExpIsNotNull(new ExpVar(vNo));
                valKey = varAtomPhrase;
            }
            let setNo = factory.createSet();
            statements.push(setNo);
            let selectNO = factory.createSelect();
            selectNO.col('value');
            selectNO.from(new EntityTable(EnumSysTable.ixBudStr, false));
            selectNO.where(new ExpAnd(
                new ExpEQ(new ExpField('i'), new ExpVar(cId)),
                new ExpEQ(new ExpField('x'), new ExpNum(no.id)),
            ));
            setNo.equ(vNo, new ExpSelect(selectNO));

            let ifNoNull = factory.createIf();
            statements.push(ifNoNull);
            ifNoNull.cmp = noNullCmp;

            let setI = factory.createSet();
            ifNoNull.then(setI);
            setI.equ(vI, valKey);

            let del = factory.createDelete();
            ifNoNull.then(del);
            del.tables = [a];
            del.from(new EntityTable(EnumSysTable.atomUnique, false, a));
            del.where(new ExpAnd(
                new ExpEQ(new ExpField('i', a), new ExpVar(vI)),
                new ExpOr(
                    new ExpEQ(new ExpField('atom', a), new ExpVar(cId)),
                    new ExpEQ(new ExpField('x', a), new ExpVar(vNo)),
                ),
            ))
            let insert = factory.createInsert();
            ifNoNull.then(insert);
            insert.table = new EntityTable(EnumSysTable.atomUnique, false);
            insert.ignore = true;
            insert.cols = [
                { col: 'i', val: new ExpVar(vI) },
                { col: 'x', val: new ExpVar(vNo) },
                { col: 'atom', val: new ExpVar(cId) },
            ]
        }

        for (let unique of uniqueArr) {
            buildUnique(unique);
        }
    }

    private buildUniqueProc(proc: Procedure) {
        const { uniques } = this.bizEntity;

        const { parameters, statements } = proc;
        const { factory } = this.context;

        const cBase = '$base';
        const cId = '$id';
        const site = '$site';
        const budPhrase = '$budPhrase';

        parameters.push(
            bigIntField(site),
            bigIntField(cId),
            bigIntField(cBase),
            bigIntField(budPhrase),
        );

        const declare = factory.createDeclare();
        statements.push(declare);

        function buildUnique(unique: IDUnique) {
            const { name, keys, no } = unique;
            let vKey = `${name}_key`;
            let vNo = `${name}_no`;
            let vI = `${name}_i`;
            declare.var(vKey, new BigInt());
            declare.var(vNo, new Char(400));
            declare.var(vI, new BigInt());
            let noNullCmp: ExpCmp;
            let valKey: ExpVal;
            let ifUnique = factory.createIf();
            let varBudPhrase = new ExpVar(budPhrase);
            let inArr = [varBudPhrase, ...keys.map(v => new ExpNum(v.id)), new ExpNum(no.id)];
            ifUnique.cmp = new ExpOr(new ExpIsNull(varBudPhrase), new ExpIn(...inArr));
            if (keys.length > 0) {
                let setKey = factory.createSet();
                ifUnique.then(setKey);
                let selectKey = factory.createSelect();
                selectKey.col('value');
                selectKey.from(new EntityTable(EnumSysTable.ixBudInt, false));
                selectKey.where(new ExpAnd(
                    new ExpEQ(new ExpField('i'), new ExpVar(cId)),
                    new ExpEQ(new ExpField('x'), new ExpNum(keys[0].id)),
                ));
                setKey.equ(vKey, new ExpSelect(selectKey));
                noNullCmp = new ExpAnd(
                    new ExpIsNotNull(new ExpVar(vKey)),
                    new ExpIsNotNull(new ExpVar(vNo)),
                );
                valKey = new ExpFuncInUq('bud$id', [
                    ExpNull.null, ExpNull.null, ExpNum.num1, ExpNull.null,
                    new ExpVar(cBase), new ExpVar(vKey)
                ], true);
            }
            else {
                noNullCmp = new ExpIsNotNull(new ExpVar(vNo));
                valKey = new ExpVar(cBase);
            }
            let setNo = factory.createSet();
            ifUnique.then(setNo);
            let selectNO = factory.createSelect();
            selectNO.col('value');
            selectNO.from(new EntityTable(EnumSysTable.ixBudStr, false));
            selectNO.where(new ExpAnd(
                new ExpEQ(new ExpField('i'), new ExpVar(cId)),
                new ExpEQ(new ExpField('x'), new ExpNum(no.id)),
            ));
            setNo.equ(vNo, new ExpSelect(selectNO));

            let ifNoNull = factory.createIf();
            ifUnique.then(ifNoNull);
            ifNoNull.cmp = noNullCmp;

            let setI = factory.createSet();
            ifNoNull.then(setI);
            setI.equ(vI, valKey);

            let upsert = factory.createUpsert();
            ifNoNull.then(upsert);
            upsert.table = new EntityTable(EnumSysTable.atomUnique, false);
            upsert.keys = [
                { col: 'i', val: new ExpVar(vI) },
                { col: 'x', val: new ExpVar(vNo) },
            ];
            upsert.cols = [
                { col: 'atom', val: new ExpVar(cId) },
            ]

            return ifUnique;
        }

        for (let unique of uniques) {
            let ret = buildUnique(unique);
            statements.push(ret);
        }
    }
}
