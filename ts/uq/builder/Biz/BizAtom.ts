import {
    BigInt, BizSpec, BizBudValue, BudDataType, Char, DataType, Dec, JoinType
    , JsonDataType, bigIntField, idField, jsonField, EnumSysTable, BizBud, BizAtom, IDUnique
} from "../../il";
import {
    ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpIn, ExpIsNotNull, ExpIsNull, ExpNull, ExpNum
    , ExpSelect, ExpStr, ExpVal, ExpVar, Procedure
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizAtom extends BBizEntity<BizAtom> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures
        const { id, uniques } = this.bizEntity;
        if (uniques !== undefined) {
            const procUnqiue = this.createProcedure(`${this.context.site}.${id}u`);
            this.buildUniqueProc(procUnqiue);
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
            declare.var(vNo, new BigInt());
            declare.var(vI, new BigInt());
            let noNullCmp: ExpCmp;
            let valKey: ExpVal;
            let ifUnique = factory.createIf();
            let inArr = [new ExpVar(budPhrase), ...keys.map(v => new ExpNum(v.id)), new ExpNum(no.id)];
            ifUnique.cmp = new ExpIn(...inArr);
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
