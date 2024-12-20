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
exports.BBizEntity = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a';
const b = 'b';
const c = 'c';
class BBizEntity {
    constructor(context, bizEntity) {
        this.expStringify = (value) => {
            const exp = this.context.convertExp(value);
            if (exp === undefined)
                return;
            let sb = this.context.createClientBuilder();
            exp.to(sb);
            const { sql } = sb;
            if (sql.length > 30) {
                debugger;
                let sb = this.context.createClientBuilder();
                exp.to(sb);
            }
            return sql;
        };
        this.context = context;
        this.bizEntity = bizEntity;
    }
    buildTables() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    buildProcedures() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bizEntity.forEachBud((bud) => {
                const { value } = bud;
                if (value === undefined)
                    return;
            });
        });
    }
    buildDirectSqls() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    buildBudsValue() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bizEntity.forEachBud((bud) => {
                if (!bud)
                    return;
                bud.buildBudValue(this.expStringify);
            });
        });
    }
    createSiteTable(tableName) {
        return this.createTable(String(tableName));
    }
    createTable(tableName) {
        const table = this.context.createTable(tableName);
        this.context.coreObjs.tables.push(table);
        return table;
    }
    createSiteEntityProcedure(suffix = undefined) {
        //return this.createProcedure(`${this.context.site}.${procName}`);
        return this.createProcedure(`${this.bizEntity.id}` + (suffix !== null && suffix !== void 0 ? suffix : ''));
    }
    createSiteProcedure(objId, suffix = undefined) {
        return this.createProcedure(`${objId}` + (suffix !== null && suffix !== void 0 ? suffix : ''));
    }
    createProcedure(procName) {
        const proc = this.context.createProcedure(procName, true);
        this.context.coreObjs.procedures.push(proc);
        return proc;
    }
    createSiteEntityFunction(returnType, suffix = undefined) {
        return this.createFunction(`${this.bizEntity.id}` + (suffix !== null && suffix !== void 0 ? suffix : ''), returnType);
    }
    createFunction(name, returnType) {
        const func = this.context.createAppFunc(name, returnType);
        this.context.coreObjs.procedures.push(func);
        return func;
    }
    stringify(value) {
        const exp = this.context.convertExp(value);
        if (exp === undefined)
            return;
        let sb = this.context.createClientBuilder();
        exp.to(sb);
        const { sql } = sb;
        return sql;
    }
    buildGetShowBuds(showBuds, tempTable, tempField) {
        let statements = [];
        let { factory } = this.context;
        for (let fieldShow of showBuds) {
            let memo = factory.createMemo();
            statements.push(memo);
            memo.text = fieldShow.map(v => { var _a, _b; return v === undefined ? '^' : (_b = (_a = v.ui) === null || _a === void 0 ? void 0 : _a.caption) !== null && _b !== void 0 ? _b : v.name; }).join('.');
            let select = this.buildSelect(fieldShow, tempTable, tempField);
            let insert = factory.createInsert();
            statements.push(insert);
            insert.ignore = true;
            insert.table = new statementWithFrom_1.VarTableWithSchema('props');
            insert.cols = [
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
                { col: 'id', val: undefined },
            ];
            insert.select = select;
        }
        return statements;
    }
    buildSelect(fieldShow, tempTable, tempfield) {
        const { factory } = this.context;
        const select = factory.createSelect();
        select.from(new statementWithFrom_1.VarTableWithSchema(tempTable, a));
        let lastT = 't0', lastField;
        let len = fieldShow.length - 1;
        let lastBud = fieldShow[0];
        let { name: lastBudName } = lastBud;
        if (lastBudName === 'i' || lastBudName === 'x') {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, lastT))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', lastT), new sql_1.ExpField(tempfield, a)));
            lastField = lastBudName;
        }
        else if (lastBudName[0] === '.') {
            let budName = lastBudName[1];
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField(tempfield, a)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.fork, false, c))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField(budName, b)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, lastT))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', lastT), new sql_1.ExpField('base', c)));
            lastField = 'base';
        }
        else {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField(tempfield, a)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false, lastT))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', lastT), new sql_1.ExpField('id', b)), new sql_1.ExpEQ(new sql_1.ExpField('x', lastT), new sql_1.ExpNum(lastBud.id))));
            lastField = 'value';
        }
        let tp, tId, fId;
        for (let i = 1; i < len; i++) {
            let bizBud = fieldShow[i];
            tp = 't' + i;
            if (bizBud === undefined) {
                let tblBin = tp + 'bin';
                let tblDetail = tp + 'detail';
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, tblBin))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', tblBin), new sql_1.ExpField(lastField, lastT)))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizDetail, false, tblDetail))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', tblDetail), new sql_1.ExpField('id', tblBin)))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, tp))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', tp), new sql_1.ExpField('base', tblDetail)));
                lastField = 'base';
                tId = 't0';
                fId = 'value';
            }
            else {
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false, tp))
                    .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', tp), new sql_1.ExpField(lastField, lastT)), new sql_1.ExpEQ(new sql_1.ExpField('x', tp), new sql_1.ExpNum(bizBud.id))));
                lastField = 'value';
            }
            lastT = tp;
        }
        let t = 't' + len;
        if (tId === undefined) {
            tId = t;
            fId = 'i';
        }
        let bizBud = fieldShow[len];
        let tblIxBud;
        let expFieldValue = new sql_1.ExpField('value', t);
        let colValue = new sql_1.ExpFuncCustom(factory.func_cast, expFieldValue, new sql_1.ExpDatePart('JSON'));
        switch (bizBud.dataType) {
            default:
            case BizPhraseType_1.BudDataType.radio:
                tblIxBud = il_1.EnumSysTable.ixBudInt;
                selectValue();
                break;
            case BizPhraseType_1.BudDataType.dec:
                tblIxBud = il_1.EnumSysTable.ixBudDec;
                selectValue();
                break;
            case BizPhraseType_1.BudDataType.fork:
                tblIxBud = il_1.EnumSysTable.ixBudJson;
                selectValue();
                break;
            case BizPhraseType_1.BudDataType.str:
            case BizPhraseType_1.BudDataType.char:
                tblIxBud = il_1.EnumSysTable.ixBudStr;
                colValue = new sql_1.ExpFunc('JSON_QUOTE', expFieldValue);
                selectValue();
                break;
            case BizPhraseType_1.BudDataType.check:
                tblIxBud = il_1.EnumSysTable.ixBud;
                selectCheck();
                break;
        }
        function selectValue() {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxBud, false, t))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(bizBud.id))));
            select.column(new sql_1.ExpNum(bizBud.id), 'phrase');
            select.column(colValue);
        }
        function selectCheck() {
            const k = 'k';
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxBud, false, t))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, k))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', k), new sql_1.ExpField('x', t)));
            select.column(new sql_1.ExpField('base', k), 'phrase');
            select.column(new sql_1.ExpFunc('JSON_ARRAY', sql_1.ExpNum.num0, new sql_1.ExpField('ext', k)));
            select.where(new sql_1.ExpEQ(new sql_1.ExpField('base', k), new sql_1.ExpNum(bizBud.id)));
        }
        select.column(new sql_1.ExpField(fId, tId), 'id');
        return select;
    }
}
exports.BBizEntity = BBizEntity;
//# sourceMappingURL=BizEntity.js.map