import {
    BigInt, BizSpec, BizBudValue, BudDataType, Char, DataType, Dec, JoinType
    , JsonDataType, bigIntField, idField, jsonField, EnumSysTable, BizBud, BizAtom, IDUnique
} from "../../il";
import {
    ExpAnd, ExpCmp, ExpEQ, ExpExists, ExpField, ExpFunc, ExpFuncInUq, ExpIn, ExpIsNotNull, ExpIsNull, ExpNE, ExpNot, ExpNull, ExpNum
    , ExpOr, ExpSelect, ExpStr, ExpVal, ExpVar, If, Procedure, SqlVarTable, Statement, VarTable
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

const cId = '$id';
const a = 'a';
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
            for (let [bud, uniqueArr] of budUniques) {
                const procBudUnqiue = this.createProcedure(`${this.context.site}.${bud.id}bu`);
                this.buildBudUniqueProc(procBudUnqiue, uniqueArr);
            }

            const procUnqiue = this.createProcedure(`${this.context.site}.${id}u`);
            this.buildUniqueProc(procUnqiue);
        }
    }

    private buildUniqueProc(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const cId = '$id';
        parameters.push(
            bigIntField(cId),
        );
        const declare = factory.createDeclare();
        statements.push(declare);
        const { uniques } = this.bizEntity;
        for (let unique of uniques) {
            const { id: unqiueId, name } = unique;
            let vNo = `${name}_no`;
            let vI = `${name}_i`;
            let ifNotDup = factory.createIf();
            let selectExists = factory.createSelect();
            ifNotDup.cmp = new ExpNot(new ExpExists(selectExists));
            selectExists.col('i', a, a);
            selectExists.from(new EntityTable(EnumSysTable.atomUnique, false, a));
            selectExists.where(new ExpAnd(
                new ExpEQ(new ExpField('i', a), new ExpVar(vI)),
                new ExpEQ(new ExpField('x', a), new ExpVar(vNo)),
                new ExpNE(new ExpField('atom', a), new ExpVar(cId)),
            ));
            let insertDup = factory.createInsert();
            ifNotDup.else(insertDup);
            insertDup.ignore = true;
            insertDup.table = new SqlVarTable('duptable');
            insertDup.cols = [
                { col: 'unique', val: new ExpNum(unqiueId) },
                { col: 'i', val: new ExpVar(vI) },
                { col: 'x', val: new ExpVar(vNo) },
                { col: 'atom', val: new ExpVar(cId) },
            ];
            statements.push(...this.buildUnique(unique, ifNotDup));
        }
    }

    private buildBudUniqueProc(proc: Procedure, uniqueArr: IDUnique[]) {
        const { parameters, statements } = proc;
        parameters.push(
            bigIntField(cId),
        );
        const { factory } = this.context;
        for (let unique of uniqueArr) {
            let ifNotDup = factory.createIf();
            ifNotDup.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
            statements.push(...this.buildUnique(unique, ifNotDup));
        }
    }

    private buildUnique(unique: IDUnique, ifNotDup: If) {
        let statements: Statement[] = [];
        const { factory } = this.context;
        const { id, name, keys, no } = unique;
        let vKey = `${name}_key`;
        let vNo = `${name}_no`;
        let vI = `${name}_i`;
        let varUniquePhrase = new ExpNum(id);
        let declare = factory.createDeclare();
        statements.push(declare);
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
                varUniquePhrase, new ExpVar(vKey)
            ], true);
        }
        else {
            noNullCmp = new ExpIsNotNull(new ExpVar(vNo));
            valKey = varUniquePhrase;
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

        ifNoNull.then(ifNotDup);

        let del = factory.createDelete();
        ifNotDup.then(del);
        del.tables = [a];
        del.from(new EntityTable(EnumSysTable.atomUnique, false, a));
        del.where(new ExpAnd(
            new ExpEQ(new ExpField('i', a), new ExpVar(vI)),
            new ExpOr(
                new ExpEQ(new ExpField('atom', a), new ExpVar(cId)),
                new ExpEQ(new ExpField('x', a), new ExpVar(vNo)),
            ),
        ));
        let insert = factory.createInsert();
        ifNotDup.then(insert);
        insert.table = new EntityTable(EnumSysTable.atomUnique, false);
        insert.ignore = true;
        insert.cols = [
            { col: 'i', val: new ExpVar(vI) },
            { col: 'x', val: new ExpVar(vNo) },
            { col: 'atom', val: new ExpVar(cId) },
        ];
        return statements;
    }
}
