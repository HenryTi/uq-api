import { Statement, } from '../../il';
import { Statement as SqlStatement, VarTable, Procedure } from '../sql';
import { BStatement } from './bstatement';
import { DbContext } from '../dbContext';

export class Sqls {
    private singleHeads: { [key: string]: boolean } = {};
    private singleFoots: { [key: string]: boolean } = {};
    constructor(context: DbContext, statements: SqlStatement[]) {
        this.context = context;
        this.statements = statements;
    }
    context: DbContext;
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
    }
}
