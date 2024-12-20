import {
    BigInt, BizFork, Char, DataType, Dec, JoinType
    , JsonDataType, bigIntField, idField, jsonField, EnumSysTable, BizBud,
    tinyIntField,
    SetEqu,
    bizDecType
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import {
    ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpIsNotNull, ExpIsNull, ExpNeg, ExpNull, ExpNum
    , ExpOr, ExpSelect, ExpStr, ExpVal, ExpVar, Procedure,
    Statement
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizFork extends BBizEntity<BizFork> {
    override async buildTables(): Promise<void> {
        /*
        const { id } = this.bizEntity;
        let table = this.createTable(`${this.context.site}.${id}`);
        let idField = bigIntField('id');
        table.keys = [idField];
        table.fields = [idField];
        */
    }

    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSave = this.createProcedure(`${this.context.site}.${id}$f`);
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

        const cOrgId = '$id';
        const cBase = '$base';
        // const cKeys = '$keys';
        // const cProps = '$props';
        const cValues = '$values';
        const cNewId = '$newId';
        const cKeysSet = '$keysSet';
        const cPropsSet = '$propsSet';
        const a = 'a';
        const site = '$site';
        const len = keys.length;
        // const varKeys = new ExpVar(cKeys);
        const varBase = new ExpVar(cBase);
        //const varProps = new ExpVar(cProps);
        const varValues = new ExpVar(cValues);
        const varSite = new ExpVar(site);
        const prefixBud = '$bud_';
        const prefixPhrase = '$phrase_';

        const props: BizBud[] = [];
        for (let [, value] of propsMap) props.push(value);

        parameters.push(
            bigIntField(site),
            userParam,
            bigIntField(cOrgId),
            idField(cBase, 'big'),
            // jsonField(cKeys),
            // jsonField(cProps),
            jsonField(cValues),
        );

        const declare = factory.createDeclare();
        declare.var(cNewId, new BigInt());
        declare.vars(
            bigIntField(cNewId),
            tinyIntField(cKeysSet),
            tinyIntField(cPropsSet),
        );
        statements.push(declare);

        function declareBuds(buds: BizBud[]) {
            for (let bud of buds) {
                const { id, dataType } = bud;
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
                        dt = bizDecType;
                        break;
                    case BudDataType.fork:
                        dt = new JsonDataType();
                        break;
                }
                declare.var(prefixBud + id, dt);
                declare.var(prefixPhrase + id, new BigInt());
                let setPhraseId = factory.createSet();
                statements.push(setPhraseId);
                setPhraseId.equ(prefixPhrase + id,
                    new ExpNum(id)
                )
            }
        }
        declareBuds(keys);
        declareBuds(props);

        function selectJsonValue(varJson: ExpVar, buds: BizBud[], prefix: string) {
            if (buds.length === 0) return;
            const select = factory.createSelect();
            statements.push(select);
            select.toVar = true;
            for (let bud of buds) {
                const { id } = bud;
                select.column(new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$."${id}"`)), `${prefix}${id}`);
            }
        }
        selectJsonValue(varValues, keys, prefixBud);

        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.limit(ExpNum.num1);
        select.column(new ExpField('id', a), cNewId);
        select.from(new EntityTable(EnumSysTable.fork, false, a));
        const wheres: ExpCmp[] = [new ExpEQ(new ExpField('base', a), varBase)];

        function tblAndValFromBud(bud: BizBud): { varVal: ExpVal; tbl: string; } {
            const { id, dataType } = bud;
            let varVal: ExpVal = new ExpVar(`${prefixBud}${id}`);
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
                case BudDataType.fork:
                    tbl = EnumSysTable.ixBudJson;
                    break;
            }
            return { varVal, tbl };
        }

        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { id } = key;
            const { varVal, tbl } = tblAndValFromBud(key);
            let t = 't' + i;
            select.join(JoinType.join, new EntityTable(tbl, false, t))
            select.on(new ExpAnd(
                new ExpEQ(new ExpField('i', t), new ExpField('id', a)),
                new ExpEQ(
                    new ExpField('x', t),
                    new ExpVar(prefixPhrase + id),
                ),
            ));
            wheres.push(new ExpEQ(new ExpField('value', t), varVal));
        }
        select.where(new ExpAnd(...wheres));

        function setBud(stats: Statement[], bud: BizBud) {
            const { id } = bud;
            const { varVal, tbl } = tblAndValFromBud(bud);
            const insert = factory.createInsertOnDuplicate();
            stats.push(insert);
            insert.table = new EntityTable(tbl, false);
            insert.keys.push(
                { col: 'i', val: new ExpVar(cNewId) },
                {
                    col: 'x', val: new ExpVar(prefixPhrase + id),
                },
            );
            insert.cols.push({ col: 'value', val: varVal, setEqu: SetEqu.equ });
        }
        function setBuds(stats: Statement[], buds: BizBud[]) {
            for (let bud of buds) setBud(stats, bud);
        }

        const ifNewIdNull = factory.createIf();
        statements.push(ifNewIdNull);
        ifNewIdNull.cmp = new ExpIsNull(new ExpVar(cNewId));
        const ifNewNullOrg = factory.createIf();
        ifNewIdNull.then(ifNewNullOrg);
        ifNewNullOrg.cmp = new ExpIsNotNull(new ExpVar(cOrgId));
        const setNew0 = factory.createSet();
        ifNewNullOrg.then(setNew0);
        setNew0.equ(cNewId, ExpNum.num0);
        const setId = factory.createSet();
        ifNewNullOrg.else(setId);
        setId.equ(cNewId, new ExpFuncInUq(
            'fork$id',
            [varSite, new ExpVar(userParam.name), ExpNum.num1, ExpNull.null, varBase],
            true
        ));
        const setKeysSet = factory.createSet();
        ifNewNullOrg.else(setKeysSet);
        setKeysSet.equ(cKeysSet, ExpNum.num1);
        const setPropsSet = factory.createSet();
        ifNewNullOrg.else(setPropsSet);
        setPropsSet.equ(cPropsSet, ExpNum.num1);

        const ifNewOrg = factory.createIf();
        ifNewIdNull.else(ifNewOrg);
        ifNewOrg.cmp = new ExpOr(
            new ExpIsNull(new ExpVar(cOrgId)),
            new ExpEQ(new ExpVar(cOrgId), new ExpVar(cNewId)),
        );
        ifNewOrg.then(setPropsSet);
        const setNewNeg = factory.createSet();
        ifNewIdNull.else(setNewNeg);
        setNewNeg.equ(cNewId, new ExpNeg(new ExpVar(cNewId)));

        selectJsonValue(varValues, props, prefixBud);

        const ifKeysSet = factory.createIf();
        statements.push(ifKeysSet);
        ifKeysSet.cmp = new ExpEQ(new ExpVar(cKeysSet), ExpNum.num1);
        setBuds(ifKeysSet.thenStatements, keys);

        const ifPropsSet = factory.createIf();
        statements.push(ifPropsSet);
        ifPropsSet.cmp = new ExpEQ(new ExpVar(cPropsSet), ExpNum.num1);
        setBuds(ifPropsSet.thenStatements, props);

        const setExecSqlValue = factory.createSet();
        statements.push(setExecSqlValue);
        setExecSqlValue.isAtVar = true;
        setExecSqlValue.equ('execSqlValue', new ExpVar(cNewId));
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
                    tbl = EnumSysTable.ixBudInt; break;
                case BudDataType.char:
                case BudDataType.str:
                    tbl = EnumSysTable.ixBudStr; break;
                case BudDataType.dec:
                    tbl = EnumSysTable.ixBudDec; break;
                case BudDataType.fork:
                    tbl = EnumSysTable.ixBudJson; break;
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
