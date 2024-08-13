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
const si = '$si';
const sx = '$sx';
const svalue = '$svalue';
const samount = '$samount';
const sprice = '$sprice';
const pendFrom = '$pend';
const i = 'i';
const iBase = '.i';
const x = 'x';
const xBase = '.x';
const value = consts_1.binValue;
const amount = consts_1.binAmount;
const price = consts_1.binPrice;
const binId = '$bin';
const origin = 'origin';
const $origin = '$' + origin;
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const bin = '$bin';
const tempBinTable = 'bin';
const binFieldsSet = new Set(consts_1.binFieldArr);
var BinIType;
(function (BinIType) {
    BinIType[BinIType["atom"] = 0] = "atom";
    BinIType[BinIType["fork"] = 1] = "fork";
    BinIType[BinIType["forkAtom"] = 2] = "forkAtom";
})(BinIType || (BinIType = {}));
class BBizBin extends BizEntity_1.BBizEntity {
    buildBudsValue() {
        const _super = Object.create(null, {
            buildBudsValue: { get: () => super.buildBudsValue }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildBudsValue.call(this);
            const { inputArr, pickArr } = this.bizEntity;
            if (inputArr !== undefined) {
                for (let input of inputArr) {
                    input.buildBudValue(this.expStringify);
                }
            }
            if (pickArr !== undefined) {
                for (let pick of pickArr) {
                    pick.buildBudValue(this.expStringify);
                }
            }
        });
    }
    buildProcedures() {
        const _super = Object.create(null, {
            buildProcedures: { get: () => super.buildProcedures }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildProcedures.call(this);
            const { id } = this.bizEntity;
            const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
            this.buildSubmitProc(procSubmit);
            const procGet = this.createProcedure(`${this.context.site}.${id}gb`);
            this.buildGetProc(procGet);
        });
    }
    buildSubmitProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam, site } = this.context;
        const { act, div, main } = this.bizEntity;
        parameters.push(userParam, (0, il_1.bigIntField)(bin));
        if (act === undefined) {
            return;
        }
        const declare = factory.createDeclare();
        statements.push(declare);
        const bigint = new il_1.BigInt();
        const decValue = new il_1.Dec(18, 6);
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
        declare.var($origin, bigint);
        let pDiv = div;
        for (;; pDiv = pDiv.div) {
            declare.var(bin + pDiv.level, bigint);
            if (pDiv.div === undefined)
                break;
        }
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_2.$site, new sql_1.ExpNum(site));
        const varBin = new sql_1.ExpVar(bin);
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
        if (main !== undefined) {
            // build main bud field
            let varSheetId = new sql_1.ExpVar(sheetId);
            for (let [, bud] of main.props) {
                let { name } = bud;
                if (binFieldsSet.has(name) === true)
                    continue;
                let varName = '$s' + name;
                statements.push(...(0, tools_1.buildSelectBinBud)(this.context, bud, varSheetId, varName));
            }
        }
        for (;; pDiv = pDiv.parent) {
            const { level } = pDiv;
            const selectDiv = factory.createSelect();
            statements.push(selectDiv);
            selectDiv.toVar = true;
            selectDiv.column(new sql_1.ExpField(origin, a), level === 1 ? $origin : bin + (level - 1));
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
        // const { iBase, xBase } = this.bizEntity;
        // this.buildGetIXBase(statements, iBase);
        // this.buildGetIXBase(statements, xBase);
        // let showBuds = this.bizEntity.allShowBuds();
        /*
        if (showBuds === undefined) {
            proc.dropOnly = true;
            return;
        }
        */
        let { factory, site } = this.context;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(consts_2.$site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_2.$site, new sql_1.ExpNum(site));
        /*
        if (showBuds !== undefined) {
            let memo = factory.createMemo();
            statements.push(memo)
            memo.text = this.bizEntity.name + ' show buds';
            statements.push(...this.buildGetShowBuds(showBuds, tempBinTable, 'id'));
        }

        const expValue = new ExpField('value', c);
        function funcJSON_QUOTE() {
            return new ExpFunc('JSON_QUOTE', expValue);
        }
        function funcCast() {
            return new ExpFuncCustom(factory.func_cast, expValue, new ExpDatePart('JSON'))
        }

        let budTypes: [() => ExpVal, EnumSysTable][] = [
            [funcCast, EnumSysTable.ixBudInt],
            [funcCast, EnumSysTable.ixBudDec],
            [funcJSON_QUOTE, EnumSysTable.ixBudStr],
        ]

        for (let binIType of [BinIType.atom, BinIType.fork, BinIType.forkAtom]) {
            for (let [func, tbl] of budTypes) {
                this.buildGetShowBudsFromAtomId(statements, binIType, func, tbl);
            }
        }
        */
    }
}
exports.BBizBin = BBizBin;
//# sourceMappingURL=BizBin.js.map