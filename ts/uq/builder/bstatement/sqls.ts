import { Sheet, Int, Text, Statement, } from '../../il';
import { Statement as SqlStatement, VarTable, ExpEQ, ExpNum, ExpField, ExpVar, ExpGT, ExpAnd, ExpStr, ExpNull, ExpIsNull, SqlVarTable, ExpFunc, ExpSelect, Procedure, ExpVal, ExpAdd, ExpFuncCustom } from '../sql';
import { BStatement } from './bstatement';
import { DbContext } from '../dbContext';
import { VarTable as SelectVarTable, EntityTable } from '../sql/statementWithFrom';
import { LockType } from '../sql/select';

export class Sqls {
    private singleHeads: { [key: string]: boolean } = {};
    private singleFoots: { [key: string]: boolean } = {};
    constructor(context: DbContext, statements: SqlStatement[]) {
        this.context = context;
        this.statements = statements;
    }
    context: DbContext;
    sheets: { [name: string]: Sheet } = {}
    varTables: { [name: string]: VarTable } = {}
    statements: SqlStatement[];
    push(...statement: SqlStatement[]) { this.statements.push(...statement) }
    addStatements(statements: SqlStatement[]) {
        if (statements === undefined) return;
        for (let s of statements) {
            if (s === undefined) continue;
            this.statements.push(s);
        }
    }
    head(statements: Statement[]) {
        if (statements === undefined) return;
        for (let s of statements) {
            let b = s.db(this.context) as BStatement;
            if (b === undefined) continue;
            let { singleKey } = b;
            if (singleKey !== undefined) {
                if (this.singleHeads[singleKey] !== true) {
                    b.singleHead(this);
                    this.singleHeads[singleKey] = true;
                }
            }
            b.head(this);
        };
    }
    foot(statements: Statement[]) {
        if (statements === undefined) return;
        for (let s of statements) {
            let b = s.db(this.context) as BStatement;
            if (b === undefined) continue;
            let { singleKey } = b;
            if (singleKey !== undefined) {
                if (this.singleFoots[singleKey] !== true) {
                    b.singleFoot(this);
                    this.singleFoots[singleKey] = true;
                }
            }
            b.foot(this);
        };
    }
    body(statements: Statement[]) {
        if (statements === undefined) return;
        for (let s of statements) {
            let b = s.db(this.context) as BStatement;
            if (b !== undefined) b.body(this);
        };
    }
    done(proc: Procedure) {
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

    private buildCreateSheet(sheet: Sheet) {
        let { factory, hasUnit, unitFieldName, userParam } = this.context;
        let memo = factory.createMemo();
        this.statements.push(memo);
        memo.text = '-- build create sheet ';

        let declare = factory.createDeclare();
        this.statements.push(declare);
        declare.var('$sheet$pre', new Int);
        declare.var('$sheet$id', new Int);
        declare.var('$sheet$$', new Text);

        let setPre0 = factory.createSet();
        this.statements.push(setPre0);
        setPre0.equ('$sheet$pre', ExpVal.num0);
        let whileLoop = factory.createWhile();
        this.statements.push(whileLoop);
        whileLoop.no = 9999;
        whileLoop.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);
        let wstats = whileLoop.statements.statements;
        let set = factory.createSet();
        wstats.push(set);
        set.equ('$sheet$id', ExpVal.null);
        let select = factory.createSelect();
        wstats.push(select);
        select.toVar = true;
        select.col('id', '$sheet$id');
        select.from(new SelectVarTable('$sheet'));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('sid'), ExpVal.num0),
            new ExpEQ(new ExpField('arr'), new ExpStr('$')),
            new ExpGT(new ExpField('id'), new ExpVar('$sheet$pre'))
        ));
        select.order(new ExpField('id'), 'asc');
        select.limit(ExpVal.num1);
        let iif = factory.createIf();
        wstats.push(iif);
        iif.cmp = new ExpIsNull(new ExpVar('$sheet$id'))
        let exit = factory.createBreak();
        iif.then(exit);
        exit.no = whileLoop.no;

        let setPreId = factory.createSet();
        wstats.push(setPreId);
        setPreId.equ('$sheet$pre', new ExpVar('$sheet$id'));

        let selectMain = factory.createSelect();
        wstats.push(selectMain);
        selectMain.toVar = true;
        selectMain.column(
            new ExpFunc(factory.func_concat, new ExpField('text'), new ExpStr('\\n')),
            '$sheet$$');
        selectMain.from(new SelectVarTable('$sheet'));
        selectMain.where(new ExpAnd(
            new ExpEQ(new ExpField('sid'), ExpVal.num0),
            new ExpEQ(new ExpField('arr'), new ExpStr('$')),
            new ExpEQ(new ExpField('id'), new ExpVar('$sheet$id'))
        ));

        for (let arr of sheet.arrs) {
            let { name } = arr;
            declare.var('$sheet$' + name, new Text);
            let selectArr = factory.createSelect();
            wstats.push(selectArr);
            selectArr.toVar = true;
            selectArr.column(
                new ExpFunc(
                    factory.func_concat,
                    new ExpFuncCustom(
                        factory.func_group_concat,
                        new ExpField('text'),
                        new ExpStr('\\n'),
                    ),
                    new ExpStr('\\n\\n')
                ),
                '$sheet$' + name);
            selectArr.from(new SelectVarTable('$sheet'));
            selectArr.where(new ExpAnd(
                new ExpEQ(new ExpField('sid'), new ExpVar('$sheet$id')),
                new ExpEQ(new ExpField('arr'), new ExpStr(name)),
            ));
            selectArr.order(new ExpField('id'), 'asc');
        }

        let callSave = factory.createCall();
        wstats.push(callSave);
        callSave.procName = this.context.twProfix + '$sheet_save';
        callSave.params = [
            { value: new ExpVar(unitFieldName) },
            { value: new ExpVar(userParam.name) },
            { value: new ExpStr(sheet.name) },
            { value: ExpNum.num0 }, //new ExpVar('$sheet_app'),
            { value: new ExpStr('$auto') },
            {
                value: new ExpFunc(
                    factory.func_concat,
                    new ExpVar('$sheet$$'),
                    ...sheet.arrs.map(v => new ExpVar('$sheet$' + v.name))
                )
            },
        ];

        let selectSheetId = factory.createSelect();
        selectSheetId.column(new ExpField('big'));
        selectSheetId.from(new EntityTable('$setting', false));
        let selectSheetIdWheres = [
            new ExpEQ(new ExpField('name'), new ExpStr('sheet_seed')),
        ];
        if (hasUnit === true) {
            selectSheetIdWheres.push(new ExpEQ(new ExpField(unitFieldName), ExpNum.num0));
        }
        selectSheetId.where(new ExpAnd(...selectSheetIdWheres));
        selectSheetId.lock = LockType.update;

        let callAction = factory.createCall();
        wstats.push(callAction);
        callAction.procName = this.context.twProfix + `${sheet.name}_$onsave`;
        callAction.params = [
            { value: new ExpVar(unitFieldName) },
            { value: new ExpVar(userParam.name) },
            { value: new ExpSelect(selectSheetId) },
            { value: ExpNum.num0 },
            { value: new ExpStr('$onsave') },
        ];
    }
}
