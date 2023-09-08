"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sqls = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const select_1 = require("../sql/select");
class Sqls {
    constructor(context, statements) {
        this.singleHeads = {};
        this.singleFoots = {};
        this.sheets = {};
        this.varTables = {};
        this.context = context;
        this.statements = statements;
    }
    push(...statement) { this.statements.push(...statement); }
    addStatements(statements) {
        if (statements === undefined)
            return;
        for (let s of statements) {
            if (s === undefined)
                continue;
            this.statements.push(s);
        }
    }
    head(statements) {
        if (statements === undefined)
            return;
        for (let s of statements) {
            let b = s.db(this.context);
            if (b === undefined)
                continue;
            let { singleKey } = b;
            if (singleKey !== undefined) {
                if (this.singleHeads[singleKey] !== true) {
                    b.singleHead(this);
                    this.singleHeads[singleKey] = true;
                }
            }
            b.head(this);
        }
        ;
    }
    foot(statements) {
        if (statements === undefined)
            return;
        for (let s of statements) {
            let b = s.db(this.context);
            if (b === undefined)
                continue;
            let { singleKey } = b;
            if (singleKey !== undefined) {
                if (this.singleFoots[singleKey] !== true) {
                    b.singleFoot(this);
                    this.singleFoots[singleKey] = true;
                }
            }
            b.foot(this);
        }
        ;
    }
    body(statements) {
        if (statements === undefined)
            return;
        for (let s of statements) {
            let b = s.db(this.context);
            if (b !== undefined)
                b.body(this);
        }
        ;
    }
    done(proc) {
        for (let i in this.varTables) {
            let vt = this.varTables[i];
            this.statements.unshift(vt);
        }
        for (let i in this.sheets) {
            let sheet = this.sheets[i];
            this.buildCreateSheet(sheet);
            proc.hasGroupConcat = true;
        }
    }
    buildCreateSheet(sheet) {
        let { factory, hasUnit, unitFieldName, userParam } = this.context;
        let memo = factory.createMemo();
        this.statements.push(memo);
        memo.text = '-- build create sheet ';
        let declare = factory.createDeclare();
        this.statements.push(declare);
        declare.var('$sheet$pre', new il_1.Int);
        declare.var('$sheet$id', new il_1.Int);
        declare.var('$sheet$$', new il_1.Text);
        let setPre0 = factory.createSet();
        this.statements.push(setPre0);
        setPre0.equ('$sheet$pre', sql_1.ExpVal.num0);
        let whileLoop = factory.createWhile();
        this.statements.push(whileLoop);
        whileLoop.no = 9999;
        whileLoop.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        let wstats = whileLoop.statements.statements;
        let set = factory.createSet();
        wstats.push(set);
        set.equ('$sheet$id', new sql_1.ExpNull());
        let select = factory.createSelect();
        wstats.push(select);
        select.toVar = true;
        select.col('id', '$sheet$id');
        select.from(new statementWithFrom_1.VarTable('$sheet'));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('sid'), sql_1.ExpVal.num0), new sql_1.ExpEQ(new sql_1.ExpField('arr'), new sql_1.ExpStr('$')), new sql_1.ExpGT(new sql_1.ExpField('id'), new sql_1.ExpVar('$sheet$pre'))));
        select.order(new sql_1.ExpField('id'), 'asc');
        select.limit(sql_1.ExpVal.num1);
        let iif = factory.createIf();
        wstats.push(iif);
        iif.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('$sheet$id'));
        let exit = factory.createBreak();
        iif.then(exit);
        exit.no = whileLoop.no;
        let setPreId = factory.createSet();
        wstats.push(setPreId);
        setPreId.equ('$sheet$pre', new sql_1.ExpVar('$sheet$id'));
        let selectMain = factory.createSelect();
        wstats.push(selectMain);
        selectMain.toVar = true;
        selectMain.column(new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpField('text'), new sql_1.ExpStr('\\n')), '$sheet$$');
        selectMain.from(new statementWithFrom_1.VarTable('$sheet'));
        selectMain.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('sid'), sql_1.ExpVal.num0), new sql_1.ExpEQ(new sql_1.ExpField('arr'), new sql_1.ExpStr('$')), new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('$sheet$id'))));
        for (let arr of sheet.arrs) {
            let { name } = arr;
            declare.var('$sheet$' + name, new il_1.Text);
            let selectArr = factory.createSelect();
            wstats.push(selectArr);
            selectArr.toVar = true;
            selectArr.column(new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpFuncCustom(factory.func_group_concat, new sql_1.ExpField('text'), new sql_1.ExpStr('\\n')), new sql_1.ExpStr('\\n\\n')), '$sheet$' + name);
            selectArr.from(new statementWithFrom_1.VarTable('$sheet'));
            selectArr.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('sid'), new sql_1.ExpVar('$sheet$id')), new sql_1.ExpEQ(new sql_1.ExpField('arr'), new sql_1.ExpStr(name))));
            selectArr.order(new sql_1.ExpField('id'), 'asc');
        }
        let callSave = factory.createCall();
        wstats.push(callSave);
        callSave.procName = this.context.twProfix + '$sheet_save';
        callSave.params = [
            { value: new sql_1.ExpVar(unitFieldName) },
            { value: new sql_1.ExpVar(userParam.name) },
            { value: new sql_1.ExpStr(sheet.name) },
            { value: sql_1.ExpNum.num0 },
            { value: new sql_1.ExpStr('$auto') },
            {
                value: new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar('$sheet$$'), ...sheet.arrs.map(v => new sql_1.ExpVar('$sheet$' + v.name)))
            },
        ];
        let selectSheetId = factory.createSelect();
        selectSheetId.column(new sql_1.ExpField('big'));
        selectSheetId.from(new statementWithFrom_1.EntityTable('$setting', false));
        let selectSheetIdWheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('sheet_seed')),
        ];
        if (hasUnit === true) {
            selectSheetIdWheres.push(new sql_1.ExpEQ(new sql_1.ExpField(unitFieldName), sql_1.ExpNum.num0));
        }
        selectSheetId.where(new sql_1.ExpAnd(...selectSheetIdWheres));
        selectSheetId.lock = select_1.LockType.update;
        let callAction = factory.createCall();
        wstats.push(callAction);
        callAction.procName = this.context.twProfix + `${sheet.name}_$onsave`;
        callAction.params = [
            { value: new sql_1.ExpVar(unitFieldName) },
            { value: new sql_1.ExpVar(userParam.name) },
            { value: new sql_1.ExpSelect(selectSheetId) },
            { value: sql_1.ExpNum.num0 },
            { value: new sql_1.ExpStr('$onsave') },
        ];
    }
}
exports.Sqls = Sqls;
//# sourceMappingURL=sqls.js.map