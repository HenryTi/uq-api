"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizBin = void 0;
const consts_1 = require("../../consts");
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const consts_2 = require("../consts");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const tools_1 = require("../tools");
const BizEntity_1 = require("./BizEntity");
const sheetId = 'sheet1'; // 实际写表时，会加上bin div.level=1
const si = 'si';
const sx = 'sx';
const svalue = 'svalue';
const samount = 'samount';
const sprice = 'sprice';
const pendFrom = 'pend';
const i = 'i';
const iBase = '.i';
const x = 'x';
const xBase = '.x';
const value = consts_1.binValue;
const amount = consts_1.binAmount;
const price = consts_1.binPrice;
const binId = 'bin';
const origin = 'origin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const bin = 'bin';
const tempBinTable = 'bin';
const binFieldsSet = new Set(consts_1.binFieldArr);
class BBizBin extends BizEntity_1.BBizEntity {
    async buildBudsValue() {
        super.buildBudsValue();
        const { inputArr } = this.bizEntity;
        if (inputArr !== undefined) {
            for (let input of inputArr) {
                input.buildBudValue(this.expStringify);
            }
        }
    }
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
        const procGet = this.createProcedure(`${this.context.site}.${id}gb`);
        this.buildGetProc(procGet);
    }
    buildSubmitProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam, site } = this.context;
        const { act, div } = this.bizEntity;
        parameters.push(userParam, (0, il_1.bigIntField)(bin));
        if (act === undefined) {
            return;
        }
        const declare = factory.createDeclare();
        statements.push(declare);
        const bigint = new il_1.BigInt();
        const decValue = new il_1.Dec(18, 6);
        const str = new il_1.Char(200);
        const json = new il_1.JsonDataType();
        declare.var(consts_2.$site, bigint);
        declare.var(sheetId, bigint);
        declare.var(si, bigint);
        declare.var(sx, bigint);
        declare.var(svalue, decValue);
        declare.var(samount, decValue);
        declare.var(sprice, decValue);
        declare.var(pendFrom, bigint);
        declare.var(i, bigint);
        declare.var(iBase, bigint);
        declare.var(x, bigint);
        declare.var(xBase, bigint);
        declare.var(value, decValue);
        declare.var(amount, decValue);
        declare.var(price, decValue);
        declare.var(origin, bigint);
        let pDiv = div;
        for (;; pDiv = pDiv.div) {
            declare.var(bin + pDiv.level, bigint);
            if (pDiv.div === undefined)
                break;
        }
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_2.$site, new sql_1.ExpNum(site));
        const varBin = new sql_1.ExpVar('bin');
        const dt = 'dt';
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id', a), binId);
        select.column(new sql_1.ExpField('origin', a), bin + pDiv.level);
        select.column(new sql_1.ExpField('id', c), sheetId);
        select.column(new sql_1.ExpField('i', c), si);
        select.column(new sql_1.ExpField('x', c), sx);
        select.column(new sql_1.ExpField('value', c), svalue);
        select.column(new sql_1.ExpField('price', c), sprice);
        select.column(new sql_1.ExpField('amount', c), samount);
        select.column(new sql_1.ExpField('pendFrom', d), pendFrom);
        select.column(new sql_1.ExpField('i', a), i);
        select.column(new sql_1.ExpField('x', a), x);
        select.column(new sql_1.ExpField('value', a), value);
        select.column(new sql_1.ExpField('amount', a), amount);
        select.column(new sql_1.ExpField('price', a), price);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizDetail, false, dt))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', dt), new sql_1.ExpField('id', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('base', dt)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('base', b)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.binPend, false, d))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', d), new sql_1.ExpField('id', a)));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id', a), varBin));
        let setBinThis = factory.createSet();
        statements.push(setBinThis);
        setBinThis.equ(bin + pDiv.level, new sql_1.ExpVar(bin));
        for (;; pDiv = pDiv.parent) {
            const { level } = pDiv;
            const selectDiv = factory.createSelect();
            statements.push(selectDiv);
            selectDiv.toVar = true;
            selectDiv.column(new sql_1.ExpField(origin, a), level === 1 ? origin : bin + (level - 1));
            const { buds } = pDiv;
            for (let bud of buds) {
                let { name } = bud;
                if (binFieldsSet.has(name) === true) {
                    selectDiv.column(new sql_1.ExpField(name, a), name);
                }
                else {
                    statements.push(...(0, tools_1.buildSelectBinBud)(this.context, bud, varBin));
                }
            }
            selectDiv.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, a));
            selectDiv.where(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar(bin + level)));
            if (pDiv.parent === undefined)
                break;
        }
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);
    }
    buildGetProc(proc) {
        let { statements } = proc;
        const { iBase, xBase } = this.bizEntity;
        this.buildGetIXBase(statements, iBase);
        this.buildGetIXBase(statements, xBase);
        let showBuds = this.bizEntity.allShowBuds();
        if (showBuds === undefined) {
            proc.dropOnly = true;
            return;
        }
        let { factory, site } = this.context;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(consts_2.$site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_2.$site, new sql_1.ExpNum(site));
        if (showBuds !== undefined) {
            let memo = factory.createMemo();
            statements.push(memo);
            memo.text = this.bizEntity.name + ' show buds';
            statements.push(...this.buildGetShowBuds(showBuds, tempBinTable, 'id'));
        }
    }
    buildGetIXBase(statements, bud) {
        if (bud === undefined)
            return;
        let { factory } = this.context;
        let select = factory.createSelect();
        const { name } = bud;
        let budName = name[1];
        select.column(new sql_1.ExpNum(bud.id), 'phrase');
        //select.column(new ExpFunc('JSON_ARRAY', new ExpField('base', d)));
        select.column(new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpField('base', d), new sql_1.ExpDatePart('JSON')));
        select.column(new sql_1.ExpField('id', a), 'id');
        select.from(new statementWithFrom_1.VarTableWithSchema('bin', a));
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('id', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField(budName, b)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, d))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', d), new sql_1.ExpField('base', c)));
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
}
exports.BBizBin = BBizBin;
//# sourceMappingURL=BizBin.js.map