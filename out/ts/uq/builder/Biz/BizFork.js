"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizFork = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizFork extends BizEntity_1.BBizEntity {
    buildTables() {
        return __awaiter(this, void 0, void 0, function* () {
            /*
            const { id } = this.bizEntity;
            let table = this.createTable(`${this.context.site}.${id}`);
            let idField = bigIntField('id');
            table.keys = [idField];
            table.fields = [idField];
            */
        });
    }
    buildProcedures() {
        const _super = Object.create(null, {
            buildProcedures: { get: () => super.buildProcedures }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildProcedures.call(this);
            // const { id } = this.bizEntity;
            const procSave = this.createSiteEntityProcedure('$f');
            this.buildSaveProc(procSave);
            const funcGet = this.createSiteEntityFunction(new il_1.JsonDataType());
            this.buildGetFunc(funcGet);
        });
    }
    buildSaveProc(proc) {
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
        const varBase = new sql_1.ExpVar(cBase);
        //const varProps = new ExpVar(cProps);
        const varValues = new sql_1.ExpVar(cValues);
        const varSite = new sql_1.ExpVar(site);
        const prefixBud = '$bud_';
        const prefixPhrase = '$phrase_';
        const props = [];
        for (let [, value] of propsMap)
            props.push(value);
        parameters.push((0, il_1.bigIntField)(site), userParam, (0, il_1.bigIntField)(cOrgId), (0, il_1.idField)(cBase, 'big'), 
        // jsonField(cKeys),
        // jsonField(cProps),
        (0, il_1.jsonField)(cValues));
        const declare = factory.createDeclare();
        declare.var(cNewId, new il_1.BigInt());
        declare.vars((0, il_1.bigIntField)(cNewId), (0, il_1.tinyIntField)(cKeysSet), (0, il_1.tinyIntField)(cPropsSet));
        statements.push(declare);
        function declareBuds(buds) {
            for (let bud of buds) {
                const { id, dataType } = bud;
                let dt;
                switch (dataType) {
                    default:
                    case BizPhraseType_1.BudDataType.date:
                        dt = new il_1.BigInt();
                        break;
                    case BizPhraseType_1.BudDataType.str:
                    case BizPhraseType_1.BudDataType.char:
                        dt = new il_1.Char(200);
                        break;
                    case BizPhraseType_1.BudDataType.dec:
                        dt = il_1.bizDecType;
                        break;
                    case BizPhraseType_1.BudDataType.fork:
                        dt = new il_1.JsonDataType();
                        break;
                }
                declare.var(prefixBud + id, dt);
                declare.var(prefixPhrase + id, new il_1.BigInt());
                let setPhraseId = factory.createSet();
                statements.push(setPhraseId);
                setPhraseId.equ(prefixPhrase + id, new sql_1.ExpNum(id));
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
                const { id } = bud;
                select.column(new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${id}"`)), `${prefix}${id}`);
            }
        }
        selectJsonValue(varValues, keys, prefixBud);
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.limit(sql_1.ExpNum.num1);
        select.column(new sql_1.ExpField('id', a), cNewId);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.fork, false, a));
        const wheres = [new sql_1.ExpEQ(new sql_1.ExpField('base', a), varBase)];
        function tblAndValFromBud(bud) {
            const { id, dataType } = bud;
            let varVal = new sql_1.ExpVar(`${prefixBud}${id}`);
            let tbl;
            switch (dataType) {
                default:
                    tbl = il_1.EnumSysTable.ixBudInt;
                    break;
                case BizPhraseType_1.BudDataType.date:
                    tbl = il_1.EnumSysTable.ixBudInt;
                    break;
                case BizPhraseType_1.BudDataType.str:
                case BizPhraseType_1.BudDataType.char:
                    tbl = il_1.EnumSysTable.ixBudStr;
                    break;
                case BizPhraseType_1.BudDataType.dec:
                    tbl = il_1.EnumSysTable.ixBudDec;
                    break;
                case BizPhraseType_1.BudDataType.fork:
                    tbl = il_1.EnumSysTable.ixBudJson;
                    break;
            }
            return { varVal, tbl };
        }
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { id } = key;
            const { varVal, tbl } = tblAndValFromBud(key);
            let t = 't' + i;
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, t));
            select.on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpVar(prefixPhrase + id))));
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('value', t), varVal));
        }
        select.where(new sql_1.ExpAnd(...wheres));
        function setBud(stats, bud) {
            const { id } = bud;
            const { varVal, tbl } = tblAndValFromBud(bud);
            const insert = factory.createInsertOnDuplicate();
            stats.push(insert);
            insert.table = new statementWithFrom_1.EntityTable(tbl, false);
            insert.keys.push({ col: 'i', val: new sql_1.ExpVar(cNewId) }, {
                col: 'x', val: new sql_1.ExpVar(prefixPhrase + id),
            });
            insert.cols.push({ col: 'value', val: varVal, setEqu: il_1.SetEqu.equ });
        }
        function setBuds(stats, buds) {
            for (let bud of buds)
                setBud(stats, bud);
        }
        const ifNewIdNull = factory.createIf();
        statements.push(ifNewIdNull);
        ifNewIdNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(cNewId));
        const ifNewNullOrg = factory.createIf();
        ifNewIdNull.then(ifNewNullOrg);
        ifNewNullOrg.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(cOrgId));
        const setNew0 = factory.createSet();
        ifNewNullOrg.then(setNew0);
        setNew0.equ(cNewId, sql_1.ExpNum.num0);
        const setId = factory.createSet();
        ifNewNullOrg.else(setId);
        setId.equ(cNewId, new sql_1.ExpFuncInUq('fork$id', [varSite, new sql_1.ExpVar(userParam.name), sql_1.ExpNum.num1, sql_1.ExpNull.null, varBase], true));
        const setKeysSet = factory.createSet();
        ifNewNullOrg.else(setKeysSet);
        setKeysSet.equ(cKeysSet, sql_1.ExpNum.num1);
        const setPropsSet = factory.createSet();
        ifNewNullOrg.else(setPropsSet);
        setPropsSet.equ(cPropsSet, sql_1.ExpNum.num1);
        const ifNewOrg = factory.createIf();
        ifNewIdNull.else(ifNewOrg);
        ifNewOrg.cmp = new sql_1.ExpOr(new sql_1.ExpIsNull(new sql_1.ExpVar(cOrgId)), new sql_1.ExpEQ(new sql_1.ExpVar(cOrgId), new sql_1.ExpVar(cNewId)));
        ifNewOrg.then(setPropsSet);
        const setNewNeg = factory.createSet();
        ifNewIdNull.else(setNewNeg);
        setNewNeg.equ(cNewId, new sql_1.ExpNeg(new sql_1.ExpVar(cNewId)));
        selectJsonValue(varValues, props, prefixBud);
        const ifKeysSet = factory.createIf();
        statements.push(ifKeysSet);
        ifKeysSet.cmp = new sql_1.ExpEQ(new sql_1.ExpVar(cKeysSet), sql_1.ExpNum.num1);
        setBuds(ifKeysSet.thenStatements, keys);
        const ifPropsSet = factory.createIf();
        statements.push(ifPropsSet);
        ifPropsSet.cmp = new sql_1.ExpEQ(new sql_1.ExpVar(cPropsSet), sql_1.ExpNum.num1);
        setBuds(ifPropsSet.thenStatements, props);
        const setExecSqlValue = factory.createSet();
        statements.push(setExecSqlValue);
        setExecSqlValue.isAtVar = true;
        setExecSqlValue.equ('execSqlValue', new sql_1.ExpVar(cNewId));
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
                    tbl = il_1.EnumSysTable.ixBudInt;
                    break;
                case BizPhraseType_1.BudDataType.char:
                case BizPhraseType_1.BudDataType.str:
                    tbl = il_1.EnumSysTable.ixBudStr;
                    break;
                case BizPhraseType_1.BudDataType.dec:
                    tbl = il_1.EnumSysTable.ixBudDec;
                    break;
                case BizPhraseType_1.BudDataType.fork:
                    tbl = il_1.EnumSysTable.ixBudJson;
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
exports.BBizFork = BBizFork;
//# sourceMappingURL=BizFork.js.map