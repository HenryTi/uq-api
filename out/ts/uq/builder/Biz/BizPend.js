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
exports.BBizPend = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const bstatement_1 = require("../bstatement");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
const a = 'a';
const b = 'b';
const c = 'c';
class BBizPend extends BizEntity_1.BBizEntity {
    buildTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, keys } = this.bizEntity;
            if (keys === undefined)
                return;
            let table = this.createSiteTable(id); // `${this.context.site}.${id}`);
            let keyFields = keys.map(v => v.createField());
            let idField = (0, il_1.bigIntField)('id');
            table.keys = [idField];
            table.fields = [idField, ...keyFields];
            let keyIndex = new il_1.Index('$key', true);
            keyIndex.fields.push(...keyFields);
            table.indexes.push(keyIndex);
        });
    }
    buildProcedures() {
        const _super = Object.create(null, {
            buildProcedures: { get: () => super.buildProcedures }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildProcedures.call(this);
            const procQuery = this.createSiteEntityProcedure('gp');
            this.buildQueryProc(procQuery);
        });
    }
    buildQueryProc(proc) {
        const { pendQuery } = this.bizEntity;
        if (pendQuery === undefined) {
            proc.dropOnly = true;
            return;
        }
        const { params, statement } = pendQuery;
        const json = '$json';
        const varJson = new sql_1.ExpVar(json);
        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        parameters.push((0, il_1.bigIntField)('$user'), (0, il_1.jsonField)(json), (0, il_1.bigIntField)('$pageStart'), (0, il_1.bigIntField)('$pageSize'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(consts_1.$site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(site));
        for (let param of params) {
            const bud = param;
            const { id, name } = bud;
            declare.var(name, new il_1.Char(200));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${id}"`)));
        }
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: queryStatements } = statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);
        this.buildGetBinProps(statements);
    }
    buildGetBinProps(statements) {
        this.bizEntity.forEachBud(v => this.buildBinBud(statements, '$page', v));
    }
    buildBinBud(statements, tbl, bud) {
        if (bud.dataType !== BizPhraseType_1.BudDataType.bin)
            return;
        const { factory } = this.context;
        const binBud = bud;
        const { showBuds, sysBuds, sysNO } = binBud;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `bud ${binBud.getJName()} bin ${binBud.bin.getJName()}`;
        for (let sysBud of sysBuds) {
            this.buildBinSysProp(statements, tbl, binBud, sysBud);
        }
        if (sysNO === undefined) {
            this.buildBinSysProp(statements, tbl, binBud, il_1.EnumSysBud.sheetNo);
        }
        for (let [bud0, bud1] of showBuds) {
            if (bud0 === undefined) {
                this.buildBinProp(statements, tbl, bud, bud1, true);
            }
            else {
                this.buildBinProp(statements, tbl, bud, bud0, false);
            }
        }
    }
    buildBinSysProp(statements, tbl, binBud, sysBud) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable('props');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        const select = factory.createSelect();
        insert.select = select;
        select.from(new statementWithFrom_1.VarTable(tbl, a));
        let expBin = new sql_1.ExpFunc('JSON_VALUE', new sql_1.ExpField('mid', a), new sql_1.ExpStr(`$."${binBud.id}"`));
        if (binBud.bin.main !== undefined) {
            const t0 = 't0', t1 = 't1';
            select.column(new sql_1.ExpField('id', t0), 'id');
            /*
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizDetail, false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expBin))
                .join(JoinType.join, new EntityTable('bud', false, t1))
                .on(new ExpEQ(new ExpField('id', t1), new ExpField('base', t0)));
            */
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, t0))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', t0), expBin));
            expBin = new sql_1.ExpField('sheet', t0);
        }
        else {
            select.column(new sql_1.ExpField('id', c), 'id');
        }
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizSheet, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), expBin));
        select.column(new sql_1.ExpNum(sysBud), 'phrase');
        let valueCol;
        switch (sysBud) {
            default:
                debugger;
                break;
            case il_1.EnumSysBud.id:
                valueCol = 'id';
                break;
            case il_1.EnumSysBud.sheetDate:
                valueCol = 'id';
                break;
            case il_1.EnumSysBud.sheetNo:
                valueCol = 'no';
                break;
            case il_1.EnumSysBud.sheetOperator:
                valueCol = 'operator';
                break;
        }
        select.column(new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpField(valueCol, c), new sql_1.ExpDatePart('json')), 'value');
    }
    buildBinProp(statements, tbl, binBud, bud, upMain) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable('props');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        const select = factory.createSelect();
        insert.select = select;
        let tblIxName, colValue = new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpField('value', c), new sql_1.ExpDatePart('json'));
        switch (bud.dataType) {
            default:
                tblIxName = il_1.EnumSysTable.ixInt;
                break;
            case BizPhraseType_1.BudDataType.str:
            case BizPhraseType_1.BudDataType.char:
                tblIxName = il_1.EnumSysTable.ixStr;
                colValue = new sql_1.ExpFunc('JSON_QUOTE', new sql_1.ExpField('value', c));
                break;
            case BizPhraseType_1.BudDataType.dec:
                tblIxName = il_1.EnumSysTable.ixDec;
                break;
        }
        select.from(new statementWithFrom_1.VarTable(tbl, a));
        let expBin = new sql_1.ExpFunc('JSON_VALUE', new sql_1.ExpField('mid', a), new sql_1.ExpStr(`$."${binBud.id}"`));
        if (upMain === true) {
            const t1 = 't1';
            select.column(new sql_1.ExpField('id', t1), 'id');
            /*
            select.join(JoinType.join, new EntityTable('detail', false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expBin))
                .join(JoinType.join, new EntityTable('bud', false, t1))
                .on(new ExpEQ(new ExpField('id', t1), new ExpField('base', t0)));
            */
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, t1))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', t1), expBin));
            expBin = new sql_1.ExpField('sheet', t1);
        }
        else {
            select.column(new sql_1.ExpField('i', c), 'id');
        }
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxName, false, c))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', c), expBin), new sql_1.ExpEQ(new sql_1.ExpField('x', c), new sql_1.ExpNum(bud.id))));
        select.column(new sql_1.ExpField('x', c), 'phrase');
        select.column(colValue, 'value');
    }
}
exports.BBizPend = BBizPend;
//# sourceMappingURL=BizPend.js.map