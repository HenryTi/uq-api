import { BigInt, BizAtom, Int, JoinType, JsonDataType, charField, idField, textField } from "../../il";
import { ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpNum, ExpStr, ExpVar, Procedure } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizAtom extends BBizEntity<BizAtom> {
    override async buildProcedures(): Promise<void> {
        const { base, id } = this.bizEntity;
        if (base === undefined) return;
        const proc = this.createProcedure(`${id}$test`);
        this.buildTestProc(proc);
    }

    private buildTestProc(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory, unitField, userParam } = this.context;
        const { base, keys } = this.bizEntity;

        const cNo = 'no';
        const cAtom = 'atom';
        const cBase = 'base';
        const cKeys = 'keys';
        const cEx = 'ex';
        const id = 'id';
        const a = 'a';
        const site = '$site';
        const keysJson = 'keysJson';
        const varKeys = new ExpVar(keysJson);

        parameters.push(
            unitField,
            userParam,
            charField(cAtom, 200),
            idField(cBase, 'big'),
            textField(cKeys),
            charField(cEx, 200),
        );

        const declare = factory.createDeclare();
        declare.var(id, new Int());
        declare.var(site, new BigInt());
        declare.var(keysJson, new JsonDataType());
        statements.push(declare);

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new ExpVar(unitField.name));
        const setJson = factory.createSet();
        statements.push(setJson);
        setJson.equ(keysJson, new ExpVar(cKeys));

        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.limit(ExpNum.num1);
        select.column(new ExpField('id', a), id);
        select.from(new EntityTable('atom', false, a));
        const wheres: ExpCmp[] = [new ExpEQ(new ExpField(cBase, a), new ExpVar(cBase))];
        const len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { name } = key;
            const expVal = new ExpFunc('JSON_EXTRACT', varKeys, new ExpStr(`$[${i}]`));
            if (name === cNo) {
                wheres.push(new ExpEQ(new ExpField(cNo, a), expVal));
            }
            else {
                let t = 't' + i;
                select.join(JoinType.join, new EntityTable('ixbudint', false, t))
                select.on(new ExpAnd(
                    new ExpEQ(new ExpField('i', t), new ExpField('id', a)),
                    new ExpEQ(
                        new ExpField('x', t),
                        new ExpFuncInUq(
                            'phraseid',
                            [new ExpVar(site), new ExpStr(key.phrase)],
                            true)
                    ),
                ));
                wheres.push(new ExpEQ(new ExpField('value', t), expVal));
            }
        }
        select.where(new ExpAnd(...wheres));
    }
}
