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
        // const procGet = this.createProcedure(`${id}$g`);
        // this.buildGetProc(procGet);
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
        const prefixKey = '$key_';
        const prefixProp = '$prop_';
        const prefixPhrase = '$phrase_';
        const props = [];
        for (let [, value] of propsMap)
            props.push(value);
        parameters.push((0, il_1.bigIntField)(site), userParam, (0, il_1.idField)(cBase, 'big'), (0, il_1.jsonField)(cKeys), (0, il_1.jsonField)(cProps));
        const declare = factory.createDeclare();
        declare.var(cId, new il_1.BigInt());
        statements.push(declare);
        function declareBuds(buds, prefix) {
            for (let bud of buds) {
                const { name, phrase } = bud;
                declare.var(prefix + name, new il_1.Char(200));
                declare.var(prefixPhrase + name, new il_1.BigInt());
                let setPhraseId = factory.createSet();
                statements.push(setPhraseId);
                setPhraseId.equ(prefixPhrase + name, new sql_1.ExpFuncInUq('phraseid', [varSite, new sql_1.ExpStr(phrase)], true));
            }
        }
        declareBuds(keys, prefixKey);
        declareBuds(props, prefixProp);
        function selectJsonValue(varJson, buds, prefix) {
            if (buds.length === 0)
                return;
            const select = factory.createSelect();
            statements.push(select);
            select.toVar = true;
            for (let bud of buds) {
                const { name } = bud;
                select.column(new sql_1.ExpJsonProp(varJson, new sql_1.ExpStr(`$.${name}`)), `${prefix}${name}`);
            }
        }
        selectJsonValue(varKeys, keys, prefixKey);
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.limit(sql_1.ExpNum.num1);
        select.column(new sql_1.ExpField('id', a), cId);
        select.from(new statementWithFrom_1.EntityTable('spec', false, a));
        const wheres = [new sql_1.ExpEQ(new sql_1.ExpField('base', a), varBase)];
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { name, type } = key;
            const varKey = new sql_1.ExpVar(prefixKey + name);
            let t = 't' + i;
            let tbl;
            switch (type) {
                default:
                    tbl = 'ixbudint';
                    break;
                case 'char':
                    tbl = 'ixbudstr';
                    break;
                case 'dec':
                    tbl = 'ixbuddec';
                    break;
            }
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, t));
            select.on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpVar(prefixPhrase + name))));
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('value', t), varKey));
        }
        select.where(new sql_1.ExpAnd(...wheres));
        const ifIdNull = factory.createIf();
        statements.push(ifIdNull);
        ifIdNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(cId));
        const setId = factory.createSet();
        ifIdNull.then(setId);
        setId.equ(cId, new sql_1.ExpFuncInUq('spec$id', [varSite, new sql_1.ExpVar(userParam.name), sql_1.ExpNum.num1, varBase], true));
        selectJsonValue(varProps, props, prefixProp);
        function setBud(bud, prefix) {
            const { name, dataType } = bud;
            let varBud = new sql_1.ExpVar(`${prefix}${name}`);
            const insert = factory.createInsertOnDuplicate();
            statements.push(insert);
            let tbl;
            switch (dataType) {
                default:
                    tbl = 'ixbudint';
                    break;
                case il_1.BudDataType.date:
                    tbl = 'ixbudint';
                    varBud = new sql_1.ExpFunc('to_days', varBud);
                    break;
                case il_1.BudDataType.str:
                case il_1.BudDataType.char:
                    tbl = 'ixbudstr';
                    break;
                case il_1.BudDataType.dec:
                    tbl = 'ixbuddec';
                    break;
            }
            insert.table = new statementWithFrom_1.EntityTable(tbl, false);
            insert.keys.push({ col: 'i', val: new sql_1.ExpVar(cId) }, {
                col: 'x', val: new sql_1.ExpVar(prefixPhrase + name),
            });
            insert.cols.push({ col: 'value', val: varBud });
        }
        function setBuds(buds, prefix) {
            for (let bud of buds)
                setBud(bud, prefix);
        }
        setBuds(keys, prefixKey);
        setBuds(props, prefixProp);
        const setExecSqlValue = factory.createSet();
        statements.push(setExecSqlValue);
        setExecSqlValue.isAtVar = true;
        setExecSqlValue.equ('execSqlValue', new sql_1.ExpVar(cId));
    }
    buildGetProc(proc) {
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
        const varBase = new sql_1.ExpVar(cBase);
        const varVal = new sql_1.ExpVar(valJson);
        let bizAtom = this.bizEntity;
        parameters.push(unitField, userParam, (0, il_1.idField)(id, 'big'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new il_1.BigInt());
        declare.var(valJson, new il_1.JsonDataType());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new sql_1.ExpVar(unitField.name));
        const setVal = factory.createSet();
        statements.push(setVal);
        setVal.equ(valJson, new sql_1.ExpFunc('JSON_ARRAY'));
        const tableAtom = new statementWithFrom_1.EntityTable('atom', false, a);
        for (;;) {
            const selectVal = factory.createSelect();
            statements.push(selectVal);
            selectVal.toVar = true;
            selectVal.column(new sql_1.ExpField(cBase, a), id);
            selectVal.from(tableAtom);
            selectVal.where(new sql_1.ExpEQ(new sql_1.ExpField(id, a), new sql_1.ExpVar(id)));
            const { base, keys, phrase } = bizAtom;
            const len = keys.length;
            const jsonParams = [
                new sql_1.ExpStr(`$.id`),
                new sql_1.ExpField(id, a),
                new sql_1.ExpStr(`$.phrase`),
                new sql_1.ExpStr(phrase),
                new sql_1.ExpStr(`$.no`),
                new sql_1.ExpField(cNo, a),
                new sql_1.ExpStr(`$.ex`),
                new sql_1.ExpField('ex', a)
            ];
            for (let i = 0; i < len; i++) {
                let key = keys[i];
                const { name, type, phrase } = key;
                if (name === cNo)
                    continue;
                let t = 't' + i;
                let tbl;
                switch (type) {
                    default:
                        tbl = 'ixbudint';
                        break;
                    case 'char':
                        tbl = 'ixbudstr';
                        break;
                    case 'dec':
                        tbl = 'ixbuddec';
                        break;
                }
                selectVal.join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(tbl, false, t))
                    .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(id, a)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpFuncInUq('phraseid', [new sql_1.ExpVar(site), new sql_1.ExpStr(phrase)], true))));
                jsonParams.push(new sql_1.ExpStr(`$.${name}`), new sql_1.ExpField('value', t));
            }
            selectVal.column(new sql_1.ExpFunc('JSON_ARRAY_APPEND', varVal, new sql_1.ExpStr('$'), new sql_1.ExpFunc('JSON_SET', new sql_1.ExpFunc('JSON_OBJECT'), ...jsonParams)), valJson);
            if (base === undefined)
                break;
            bizAtom = base;
        }
        const selectVal = factory.createSelect();
        statements.push(selectVal);
        selectVal.column(varVal, 'val');
    }
}
exports.BBizSpec = BBizSpec;
//# sourceMappingURL=BizAtom.js.map