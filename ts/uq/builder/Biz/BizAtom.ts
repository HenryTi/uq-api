import { BigInt, BizAtom, Char, Int, JoinType, JsonDataType, OpJsonProp, charField, idField, textField } from "../../il";
import { ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpIsNull, ExpJsonProp, ExpNum, ExpStr, ExpVal, ExpVar, Procedure } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizAtom extends BBizEntity<BizAtom> {
    override async buildProcedures(): Promise<void> {
        const { id } = this.bizEntity;
        /*
        const procSave = this.createProcedure(`${id}$s`);
        this.buildSaveProc(procSave);
        const procGet = this.createProcedure(`${id}$g`);
        this.buildGetProc(procGet);
        */
    }
    /*
    private buildSaveProc(proc: Procedure) {
        const { base, keys } = this.bizEntity;
        if (base === undefined) {
            proc.dropOnly = true;
            return;
        }

        const { parameters, statements } = proc;
        const { factory, unitField, userParam } = this.context;

        const cNo = 'no';
        const cAtom = 'atom';
        const cBase = 'base';
        const cKeys = 'keys';
        const cEx = 'ex';
        const id = 'id';
        const a = 'a';
        const site = '$site';
        const keysJson = 'keysJson';
        const len = keys.length;

        const varBase = new ExpVar(cBase);
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
        declare.var(id, new BigInt());
        declare.var(site, new BigInt());
        declare.var(keysJson, new JsonDataType());
        statements.push(declare);
        for (let i = 0; i < len; i++) {
            declare.var('key' + i, new Char(200));
        }

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new ExpVar(unitField.name));
        const setJson = factory.createSet();
        statements.push(setJson);
        setJson.equ(keysJson, new ExpVar(cKeys));
        const ifBaseNull = factory.createIf();
        statements.push(ifBaseNull);
        ifBaseNull.cmp = new ExpIsNull(varBase);
        const setBaseSite = factory.createSet();
        ifBaseNull.then(setBaseSite);
        setBaseSite.equ(cBase, varBase);

        const selectKey = factory.createSelect();
        statements.push(selectKey);
        selectKey.toVar = true;
        for (let i = 0; i < len; i++) {
            selectKey.column(new ExpJsonProp(varKeys, new ExpStr(`$[${i}]`)), 'key' + i);
        }

        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.limit(ExpNum.num1);
        select.column(new ExpField('id', a), id);
        select.from(new EntityTable('atom', false, a));
        const wheres: ExpCmp[] = [new ExpEQ(new ExpField(cBase, a), varBase)];

        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { name, type } = key;
            const varKey = new ExpVar('key' + i);
            if (name === cNo) {
                wheres.push(new ExpEQ(new ExpField(cNo, a), varKey));
            }
            else {
                let t = 't' + i;
                let tbl: string;
                switch (type) {
                    default: tbl = 'ixbudint'; break;
                    case 'char': tbl = 'ixbudstr'; break;
                    case 'dec': tbl = 'ixbuddec'; break;
                }
                select.join(JoinType.join, new EntityTable(tbl, false, t))
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
                wheres.push(new ExpEQ(new ExpField('value', t), varKey));
            }
        }
        select.where(new ExpAnd(...wheres));

        const ifIdNull = factory.createIf();
        statements.push(ifIdNull);
        ifIdNull.cmp = new ExpIsNull(new ExpVar(id));
        const setId = factory.createSet();
        ifIdNull.then(setId);
        setId.equ(id, new ExpFuncInUq(
            'atom$id',
            [new ExpVar(site), new ExpVar(userParam.name), ExpNum.num1, varBase],
            true
        ));

        for (let i = 0; i < len; i++) {
            const varKey = new ExpVar('key' + i);
            const key = keys[i];
            const { name, type } = key;
            if (name === cNo) {
                const updateNo = factory.createUpdate();
                statements.push(updateNo);
                updateNo.table = new EntityTable('atom', false, a);
                updateNo.where = new ExpEQ(new ExpField(id, a), new ExpVar(id));
                updateNo.cols.push({ col: cNo, val: varKey });
            }
            else {
                const insert = factory.createInsertOnDuplicate();
                statements.push(insert);
                let tbl: string;
                switch (type) {
                    default: tbl = 'ixbudint'; break;
                    case 'char': tbl = 'ixbudstr'; break;
                    case 'dec': tbl = 'ixbuddec'; break;
                }
                insert.table = new EntityTable(tbl, false);
                insert.keys.push(
                    { col: 'i', val: new ExpVar(id) },
                    {
                        col: 'x', val: new ExpFuncInUq(
                            'phraseid',
                            [new ExpVar(site), new ExpStr(key.phrase)],
                            true)
                    },
                );
                insert.cols.push({ col: 'value', val: varKey });
            }
        }

        const updateEx = factory.createUpdate();
        statements.push(updateEx);
        updateEx.table = new EntityTable('atom', false, a);
        updateEx.where = new ExpEQ(new ExpField(id, a), new ExpVar(id));
        updateEx.cols.push({ col: 'ex', val: new ExpVar(cEx) });

        const selectId = factory.createSelect();
        statements.push(selectId);
        selectId.column(new ExpVar(id), id);
    }

    private buildGetProc(proc: Procedure) {
        const { base } = this.bizEntity;
        if (base === undefined) {
            proc.dropOnly = true;
            return;
        }

        const { parameters, statements } = proc;
        const { factory, unitField, userParam } = this.context;

        const cNo = 'no';
        const cBase = 'base';
        const id = 'id';
        const a = 'a';
        const site = '$site';
        const valJson = 'valJson';

        const varBase = new ExpVar(cBase);
        const varVal = new ExpVar(valJson);

        let bizAtom = this.bizEntity as any;

        parameters.push(
            unitField,
            userParam,
            idField(id, 'big'),
        );

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new BigInt());
        declare.var(valJson, new JsonDataType());

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new ExpVar(unitField.name));
        const setVal = factory.createSet();
        statements.push(setVal);
        setVal.equ(valJson, new ExpFunc('JSON_ARRAY'));

        const tableAtom = new EntityTable('atom', false, a);
        for (; ;) {
            const selectVal = factory.createSelect();
            statements.push(selectVal);
            selectVal.toVar = true;
            selectVal.column(new ExpField(cBase, a), id);
            selectVal.from(tableAtom);
            selectVal.where(new ExpEQ(new ExpField(id, a), new ExpVar(id)));

            const { base, keys, phrase } = bizAtom;
            const len = keys.length;

            const jsonParams: ExpVal[] = [
                new ExpStr(`$.id`),
                new ExpField(id, a),
                new ExpStr(`$.phrase`),
                new ExpStr(phrase),
                new ExpStr(`$.no`),
                new ExpField(cNo, a),
                new ExpStr(`$.ex`),
                new ExpField('ex', a)
            ];

            for (let i = 0; i < len; i++) {
                let key = keys[i];
                const { name, type, phrase } = key;
                if (name === cNo) continue;
                let t = 't' + i;
                let tbl: string;
                switch (type) {
                    default: tbl = 'ixbudint'; break;
                    case 'char': tbl = 'ixbudstr'; break;
                    case 'dec': tbl = 'ixbuddec'; break;
                }
                selectVal.join(JoinType.left, new EntityTable(tbl, false, t))
                    .on(new ExpAnd(
                        new ExpEQ(new ExpField('i', t), new ExpField(id, a)),
                        new ExpEQ(new ExpField('x', t), new ExpFuncInUq(
                            'phraseid',
                            [new ExpVar(site), new ExpStr(phrase)],
                            true)
                        )
                    ));
                jsonParams.push(
                    new ExpStr(`$.${name}`),
                    new ExpField('value', t),
                )
            }

            selectVal.column(
                new ExpFunc(
                    'JSON_ARRAY_APPEND',
                    varVal,
                    new ExpStr('$'),
                    new ExpFunc('JSON_SET', new ExpFunc('JSON_OBJECT'), ...jsonParams),
                ),
                valJson
            );

            if (base === undefined) break;
            bizAtom = base;
        }

        const selectVal = factory.createSelect();
        statements.push(selectVal);
        selectVal.column(varVal, 'val');
    }
    */
}
