import {
    BigInt, BizSpec, BizBudValue, BudDataType, Char, DataType, Dec, JoinType
    , JsonDataType, bigIntField, idField, jsonField, EnumSysTable
} from "../../il";
import {
    ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpIsNull, ExpNum
    , ExpSelect, ExpStr, ExpVal, ExpVar, Procedure
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizSpec extends BBizEntity<BizSpec> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures
        const { id } = this.bizEntity;
        const procSave = this.createProcedure(`${this.context.site}.${id}$s`);
        this.buildSaveProc(procSave);
        const funcGet = this.createFunction(`${this.context.site}.${id}`, new JsonDataType());
        this.buildGetFunc(funcGet);
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
                const { name, id, dataType } = bud;
                let dt: DataType;
                switch (dataType) {
                    default:
                    case BudDataType.date:
                        dt = new BigInt();
                        break;
                    case BudDataType.str:
                    case BudDataType.char:
                        dt = new Char(200);
                        break;
                    case BudDataType.dec:
                        dt = new Dec(18, 6);
                        break;
                }
                declare.var(prefixBud + name, dt);
                declare.var(prefixPhrase + name, new BigInt());
                let setPhraseId = factory.createSet();
                statements.push(setPhraseId);
                setPhraseId.equ(prefixPhrase + name,
                    new ExpNum(id)
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
                select.column(new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$."${name}"`)), `${prefix}${name}`);
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
            let tbl: EnumSysTable;
            switch (dataType) {
                default:
                    tbl = EnumSysTable.ixBudInt;
                    break;
                case BudDataType.date:
                    tbl = EnumSysTable.ixBudInt;
                    break;
                case BudDataType.str:
                case BudDataType.char:
                    tbl = EnumSysTable.ixBudStr;
                    break;
                case BudDataType.dec:
                    tbl = EnumSysTable.ixBudDec;
                    break;
            }
            return { varVal, tbl };
        }

        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { name } = key;
            const { varVal, tbl } = tblAndValFromBud(key);
            let t = 't' + i;
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

    private buildGetFunc(func: Procedure) {
        const { base, keys, props } = this.bizEntity;
        if (base === undefined) {
            func.dropOnly = true;
            return;
        }

        const { parameters, statements } = func;
        const { factory, userParam } = this.context;

        const id = 'id';
        const a = 'a';
        const site = '$site';
        const valJson = 'valJson';

        parameters.push(
            bigIntField(site),
            userParam,
            idField(id, 'big'),
        );

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(valJson, new JsonDataType());

        const all = [...keys];
        for (let [, value] of props) all.push(value);
        const len = all.length;
        let expArr: ExpVal[] = [];
        const t = 't';
        for (let i = 0; i < len; i++) {
            let p = all[i];
            const { id: budId, dataType } = p;
            let tbl: string;
            switch (dataType) {
                default:
                    tbl = 'ixbudint'; break;
                case BudDataType.char:
                case BudDataType.str:
                    tbl = 'ixbudstr'; break;
                case BudDataType.dec:
                    tbl = 'ixbuddec'; break;
            }
            const selectVal = factory.createSelect();
            selectVal.column(new ExpField('value', t));
            selectVal.from(new EntityTable(tbl, false, t));
            selectVal.where(new ExpAnd(
                new ExpEQ(new ExpField('i', t), new ExpVar(id)),
                new ExpEQ(new ExpField('x', t), new ExpNum(budId)),
            ));
            expArr.push(new ExpSelect(selectVal));
        }

        const setVal = factory.createSet();
        statements.push(setVal);
        setVal.equ(valJson, new ExpFunc('JSON_ARRAY', ...expArr));
        const ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = valJson;
    }
}
