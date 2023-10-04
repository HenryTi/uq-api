import { BigInt, BizAtom, BizAtomSpec, BizBudValue, BudDataType, Char, EnumDataType, Int, JoinType, JsonDataType, OpJsonProp, bigIntField, charField, idField, jsonField, textField } from "../../il";
import { ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpIsNull, ExpJsonProp, ExpNum, ExpStr, ExpVal, ExpVar, Procedure } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizSpec extends BBizEntity<BizAtomSpec> {
    override async buildProcedures(): Promise<void> {
        const { id } = this.bizEntity;
        const procSave = this.createProcedure(`${this.context.site}.${id}$s`);
        this.buildSaveProc(procSave);
        // const procGet = this.createProcedure(`${id}$g`);
        // this.buildGetProc(procGet);
    }

    private buildSaveProc(proc: Procedure) {
        const { base, keys, props: propsMap } = this.bizEntity;
        if (base === undefined) {
            proc.dropOnly = true;
            return;
        }

        const { parameters, statements } = proc;
        const { factory, unitField, userParam } = this.context;

        const cBase = '$base';
        const cKeys = '$keys';
        const cProps = '$props';
        const cId = '$id';
        const a = 'a';
        const site = '$site';
        const len = keys.length;
        const varKeys = new ExpVar(cKeys);
        const varBase = new ExpVar(cBase);
        const varProps = new ExpVar(cProps);
        const varSite = new ExpVar(site);
        const prefixBud = '$bud_';
        // const prefixProp = '$prop_';
        const prefixPhrase = '$phrase_';

        const props: BizBudValue[] = [];
        for (let [, value] of propsMap) props.push(value);

        parameters.push(
            bigIntField(site),
            userParam,
            idField(cBase, 'big'),
            jsonField(cKeys),
            jsonField(cProps),
        );

        const declare = factory.createDeclare();
        declare.var(cId, new BigInt());
        statements.push(declare);

        function declareBuds(buds: BizBudValue[]) {
            for (let bud of buds) {
                const { name, phrase } = bud;
                declare.var(prefixBud + name, new Char(200));
                declare.var(prefixPhrase + name, new BigInt());
                let setPhraseId = factory.createSet();
                statements.push(setPhraseId);
                setPhraseId.equ(prefixPhrase + name,
                    new ExpFuncInUq(
                        'phraseid',
                        [varSite, new ExpStr(phrase)],
                        true)
                )
            }
        }
        declareBuds(keys);
        declareBuds(props);

        function selectJsonValue(varJson: ExpVar, buds: BizBudValue[], prefix: string) {
            if (buds.length === 0) return;
            const select = factory.createSelect();
            statements.push(select);
            select.toVar = true;
            for (let bud of buds) {
                const { name } = bud;
                select.column(new ExpJsonProp(varJson, new ExpStr(`$.${name}`)), `${prefix}${name}`);
            }
        }
        selectJsonValue(varKeys, keys, prefixBud);

        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.limit(ExpNum.num1);
        select.column(new ExpField('id', a), cId);
        select.from(new EntityTable('spec', false, a));
        const wheres: ExpCmp[] = [new ExpEQ(new ExpField('base', a), varBase)];

        function tblAndValFromBud(bud: BizBudValue): { varVal: ExpVal; tbl: string; } {
            const { name, dataType } = bud;
            let varVal: ExpVal = new ExpVar(`${prefixBud}${name}`);
            let tbl: string;
            switch (dataType) {
                default:
                    tbl = 'ixbudint';
                    break;
                case BudDataType.date:
                    tbl = 'ixbudint';
                    varVal = new ExpFunc('to_days', varVal);
                    break;
                case BudDataType.str:
                case BudDataType.char:
                    tbl = 'ixbudstr';
                    break;
                case BudDataType.dec:
                    tbl = 'ixbuddec';
                    break;
            }
            return { varVal, tbl };
        }

        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { name } = key;
            const { varVal, tbl } = tblAndValFromBud(key);
            let t = 't' + i;
            /*
            const { name, type } = key;
            const varKey = new ExpVar(prefixBud + name);
            let t = 't' + i;
            let tbl: string;
            switch (type) {
                default: tbl = 'ixbudint'; break;
                case 'char': tbl = 'ixbudstr'; break;
                case 'dec': tbl = 'ixbuddec'; break;
            }
            */
            select.join(JoinType.join, new EntityTable(tbl, false, t))
            select.on(new ExpAnd(
                new ExpEQ(new ExpField('i', t), new ExpField('id', a)),
                new ExpEQ(
                    new ExpField('x', t),
                    new ExpVar(prefixPhrase + name),
                ),
            ));
            wheres.push(new ExpEQ(new ExpField('value', t), varVal));
        }
        select.where(new ExpAnd(...wheres));

        const ifIdNull = factory.createIf();
        statements.push(ifIdNull);
        ifIdNull.cmp = new ExpIsNull(new ExpVar(cId));
        const setId = factory.createSet();
        ifIdNull.then(setId);
        setId.equ(cId, new ExpFuncInUq(
            'spec$id',
            [varSite, new ExpVar(userParam.name), ExpNum.num1, varBase],
            true
        ));

        selectJsonValue(varProps, props, prefixBud);

        function setBud(bud: BizBudValue) {
            const { name } = bud;
            const { varVal, tbl } = tblAndValFromBud(bud);
            /*
            let varBud: ExpVal = new ExpVar(`${prefix}${name}`);
            let tbl: string;
            switch (dataType) {
                default:
                    tbl = 'ixbudint';
                    break;
                case BudDataType.date:
                    tbl = 'ixbudint';
                    varBud = new ExpFunc('to_days', varBud);
                    break;
                case BudDataType.str:
                case BudDataType.char:
                    tbl = 'ixbudstr';
                    break;
                case BudDataType.dec:
                    tbl = 'ixbuddec';
                    break;
            }
            */
            const insert = factory.createInsertOnDuplicate();
            statements.push(insert);
            insert.table = new EntityTable(tbl, false);
            insert.keys.push(
                { col: 'i', val: new ExpVar(cId) },
                {
                    col: 'x', val: new ExpVar(prefixPhrase + name),
                },
            );
            insert.cols.push({ col: 'value', val: varVal });
        }
        function setBuds(buds: BizBudValue[]) {
            for (let bud of buds) setBud(bud);
        }
        setBuds(keys);
        setBuds(props);

        const setExecSqlValue = factory.createSet();
        statements.push(setExecSqlValue);
        setExecSqlValue.isAtVar = true;
        setExecSqlValue.equ('execSqlValue', new ExpVar(cId));
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
}
