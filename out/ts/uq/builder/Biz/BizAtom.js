"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizSpec = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizSpec extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        const { id } = this.bizEntity;
        const procSave = this.createProcedure(`${this.context.site}.${id}$s`);
        this.buildSaveProc(procSave);
        const funcGet = this.createFunction(`${this.context.site}.${id}`, new il_1.JsonDataType());
        this.buildGetFunc(funcGet);
    }
    buildSaveProc(proc) {
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
        const varKeys = new sql_1.ExpVar(cKeys);
        const varBase = new sql_1.ExpVar(cBase);
        const varProps = new sql_1.ExpVar(cProps);
        const varSite = new sql_1.ExpVar(site);
        const prefixBud = '$bud_';
        // const prefixProp = '$prop_';
        const prefixPhrase = '$phrase_';
        const props = [];
        for (let [, value] of propsMap)
            props.push(value);
        parameters.push((0, il_1.bigIntField)(site), userParam, (0, il_1.idField)(cBase, 'big'), (0, il_1.jsonField)(cKeys), (0, il_1.jsonField)(cProps));
        const declare = factory.createDeclare();
        declare.var(cId, new il_1.BigInt());
        statements.push(declare);
        function declareBuds(buds) {
            for (let bud of buds) {
                const { name, id, dataType } = bud;
                let dt;
                switch (dataType) {
                    default:
                    case il_1.BudDataType.date:
                        dt = new il_1.BigInt();
                        break;
                    case il_1.BudDataType.str:
                    case il_1.BudDataType.char:
                        dt = new il_1.Char(200);
                        break;
                    case il_1.BudDataType.dec:
                        dt = new il_1.Dec(18, 6);
                        break;
                }
                declare.var(prefixBud + name, dt);
                declare.var(prefixPhrase + name, new il_1.BigInt());
                let setPhraseId = factory.createSet();
                statements.push(setPhraseId);
                setPhraseId.equ(prefixPhrase + name, new sql_1.ExpNum(id)
                /*
                new ExpFuncInUq(
                    'phraseid',
                    [varSite, new ExpStr(phrase)],
                    true)
                */
                );
            }
        }
        declareBuds(keys);
        declareBuds(props);
        function selectJsonValue(varJson, buds, prefix) {
            if (buds.length === 0)
                return;
            const select = factory.createSelect();
            statements.push(select);
            select.toVar = true;
            for (let bud of buds) {
                const { name } = bud;
                select.column(new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${name}"`)), `${prefix}${name}`);
            }
        }
        selectJsonValue(varKeys, keys, prefixBud);
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.limit(sql_1.ExpNum.num1);
        select.column(new sql_1.ExpField('id', a), cId);
        select.from(new statementWithFrom_1.EntityTable('spec', false, a));
        const wheres = [new sql_1.ExpEQ(new sql_1.ExpField('base', a), varBase)];
        function tblAndValFromBud(bud) {
            const { name, dataType } = bud;
            let varVal = new sql_1.ExpVar(`${prefixBud}${name}`);
            let tbl;
            switch (dataType) {
                default:
                    tbl = 'ixbudint';
                    break;
                case il_1.BudDataType.date:
                    tbl = 'ixbudint';
                    // const daysOf19700101 = 719528; // to_days('1970-01-01')
                    // varVal = new ExpSub(new ExpFunc('to_days', varVal), new ExpNum(daysOf19700101));
                    break;
                case il_1.BudDataType.str:
                case il_1.BudDataType.char:
                    tbl = 'ixbudstr';
                    break;
                case il_1.BudDataType.dec:
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
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, t));
            select.on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpVar(prefixPhrase + name))));
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('value', t), varVal));
        }
        select.where(new sql_1.ExpAnd(...wheres));
        const ifIdNull = factory.createIf();
        statements.push(ifIdNull);
        ifIdNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(cId));
        const setId = factory.createSet();
        ifIdNull.then(setId);
        setId.equ(cId, new sql_1.ExpFuncInUq('spec$id', [varSite, new sql_1.ExpVar(userParam.name), sql_1.ExpNum.num1, varBase], true));
        selectJsonValue(varProps, props, prefixBud);
        function setBud(bud) {
            const { name } = bud;
            const { varVal, tbl } = tblAndValFromBud(bud);
            const insert = factory.createInsertOnDuplicate();
            statements.push(insert);
            insert.table = new statementWithFrom_1.EntityTable(tbl, false);
            insert.keys.push({ col: 'i', val: new sql_1.ExpVar(cId) }, {
                col: 'x', val: new sql_1.ExpVar(prefixPhrase + name),
            });
            insert.cols.push({ col: 'value', val: varVal });
        }
        function setBuds(buds) {
            for (let bud of buds)
                setBud(bud);
        }
        setBuds(keys);
        setBuds(props);
        const setExecSqlValue = factory.createSet();
        statements.push(setExecSqlValue);
        setExecSqlValue.isAtVar = true;
        setExecSqlValue.equ('execSqlValue', new sql_1.ExpVar(cId));
    }
    buildGetFunc(func) {
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
        parameters.push((0, il_1.bigIntField)(site), userParam, (0, il_1.idField)(id, 'big'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(valJson, new il_1.JsonDataType());
        const all = [...keys];
        for (let [, value] of props)
            all.push(value);
        const len = all.length;
        let expArr = [];
        const t = 't';
        for (let i = 0; i < len; i++) {
            let p = all[i];
            const { id: budId, dataType } = p;
            let tbl;
            switch (dataType) {
                default:
                    tbl = 'ixbudint';
                    break;
                case il_1.BudDataType.char:
                case il_1.BudDataType.str:
                    tbl = 'ixbudstr';
                    break;
                case il_1.BudDataType.dec:
                    tbl = 'ixbuddec';
                    break;
            }
            const selectVal = factory.createSelect();
            selectVal.column(new sql_1.ExpField('value', t));
            selectVal.from(new statementWithFrom_1.EntityTable(tbl, false, t));
            selectVal.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpVar(id)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(budId))));
            expArr.push(new sql_1.ExpSelect(selectVal));
        }
        const setVal = factory.createSet();
        statements.push(setVal);
        setVal.equ(valJson, new sql_1.ExpFunc('JSON_ARRAY', ...expArr));
        const ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = valJson;
    }
}
exports.BBizSpec = BBizSpec;
//# sourceMappingURL=BizAtom.js.map