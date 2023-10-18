import {
    Statement, Statements, Entity, SetStatement
    , Table, VarStatement, If, ForEach, SelectStatement, BookWrite
    , Pointer, HistoryWrite, TuidWrite, StateToStatement, BusStatement
    , DeleteStatement, SheetWrite, PendingWrite
    , TableStatement, TextStatement, FailStatement, InlineStatement, /*SendStatement, Pull, */ContinueStatement
    , BreakStatement, SettingStatement, While, ReturnStatement, ProcStatement, Uq, WithStatement
    , ScheduleStatement, LogStatement, TransactionStatement, PokeStatement, SleepStatement
    , QueueStatement, ValueStatement, ExecSqlStatement, RoleStatement, AssertRoleStatement, SendStatement, BizDetailActStatement, UseStatement
} from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';
import { PContext } from '../pContext';

export abstract class PStatement<T extends Statement = Statement> extends PElement {
    statement: T;
    constructor(statement: T, context: PContext) {
        super(statement, context);
        this.statement = statement;
    }
}

export abstract class PStatements extends PStatement {
    statements: Statements;
    constructor(statements: Statements, context: PContext) {
        super(statements, context);
        this.statements = statements;
    }

    protected _parse() {
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            for (; ;) {
                while (this.ts.token === Token.SEMICOLON as any) this.ts.readToken();
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    return;
                }
                this.parseStatement();
            }
        }
        else {
            this.parseStatement();
        }
    }

    protected statementFromKey(parent: Statement, key: string): Statement {
        switch (key) {
            case 'var': return new VarStatement(parent);
            case 'use': return new UseStatement(parent);
            case 'table': return new TableStatement(parent);
            case 'text': return new TextStatement(parent);
            case 'set': return new SetStatement(parent);
            case 'with': return new WithStatement(parent);
            case 'value': return new ValueStatement(parent);
            case 'if': return new If(parent);
            case 'while': return new While(parent);
            case 'for':
            case 'foreach': return new ForEach(parent);
            case 'continue': return new ContinueStatement(parent);
            case 'break': return new BreakStatement(parent);
            case 'proc': return new ProcStatement(parent);
            case 'return': return new ReturnStatement(parent);
            case 'setting': return new SettingStatement(parent);
            case 'into':
                this.ts.readToken();
                let ignore: boolean = false;
                if (this.ts.isKeyword('ignore') === true) {
                    ignore = true;
                    this.ts.readToken();
                }
                if (this.ts.token !== Token.VAR) this.ts.expect('return表名');
                let statement = new SelectStatement(parent);
                let v1 = this.ts.lowerVar;
                if (this.ts.peekToken() === Token.DOT) {
                    this.ts.readToken();
                    this.ts.readToken();
                    if (this.ts.token as any !== Token.VAR) this.ts.expectToken(Token.VAR);
                    v1 += '.' + this.ts.lowerVar;
                }
                statement.into = v1;
                statement.ignore = ignore;
                return statement;
            case 'delete': return new DeleteStatement(parent);
            case 'log': return new LogStatement(parent);
            case 'transaction':
            case 'trans': return new TransactionStatement(parent);
            case 'poke': return new PokeStatement(parent);
            case 'sleep': return new SleepStatement(parent);
            case 'execsql': return new ExecSqlStatement(parent);
            case 'role': return new RoleStatement(parent);
            case 'assert':
                this.ts.readToken();
                if (this.ts.isKeyword('role') === true) {
                    // this.ts.readToken();
                    return new AssertRoleStatement(parent);
                }
                else {
                    this.ts.expect('role');
                }
                break;
        }
    }

    private parseStatement() {
        while (this.ts.token === Token.SEMICOLON) this.ts.readToken();
        let statement: Statement;
        if (this.ts.token === Token.CODE) {
            statement = new InlineStatement(this.statements);
        }
        else if (this.ts.token === Token.VAR) {
            statement = this.statementFromKey(this.statements, this.ts.lowerVar);
            if (statement === undefined) {
                this.expect('语法错误, 未知的' + this.ts._var);
            }
        }
        else {
            this.expect('关键字或者}');
        }
        statement.level = this.statements.level + 1;
        this.ts.readToken();
        let parser = statement.parser(this.context);
        parser.parse()
        this.statements.addStatement(statement);
    }

    preScan(space: Space): boolean {
        let ok = true;
        this.statements.eachChild((s: Statement, name) => {
            if (s.pelement.preScan(space) === false) ok = false;
        });
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        let theSpace = new StatementsSpace(space);
        let no = theSpace.newStatementNo() + 1;
        this.statements.setNo(no);
        theSpace.setStatementNo(no);
        this.statements.eachChild((s: Statement, name) => {
            no = theSpace.newStatementNo() + 1;
            s.setNo(no);
            theSpace.setStatementNo(no);
            if (s.pelement.scan(theSpace) === false) ok = false;
            theSpace.scanedStatement(s);
        });
        return ok;
    }

    scan2(uq: Uq): boolean {
        for (let stat of this.statements.statements) {
            let ret = stat.pelement.scan2(uq);
            if (ret === false) return false;
        }
        return true;
    }
}

export class PUqStatement extends PStatements {
    protected statementFromKey(parent: Statement, key: string): Statement {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'schedule': return new ScheduleStatement(parent);
        }
    }
}

class PActionBaseStatement extends PStatements {
    protected statementFromKey(parent: Statement, key: string): Statement {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'book': return new BookWrite(parent);
            // case 'pull': return new Pull(parent);
            case 'history': return new HistoryWrite(parent);
            case 'pending': return new PendingWrite(parent);
            case 'tuid': return new TuidWrite(parent);
            case 'sheet': return new SheetWrite(parent);
            case 'bus': return new BusStatement(parent);
            case 'send': return new SendStatement(parent);
            case 'schedule': return new ScheduleStatement(parent);
            case 'queue': return new QueueStatement(parent);
            /*
            case 'biz':
                return new BizDetailActStatement(parent, this.bizDetailAct);
            */
        }
    }
}

export class PActionStatement extends PActionBaseStatement {
}

export class PBusAcceptStatement extends PActionBaseStatement {
}

export class PQueryBaseStatement extends PStatements {
    protected statementFromKey(parent: Statement, key: string): Statement {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'book': return new BookWrite(parent);
            case 'history': return new HistoryWrite(parent);
            case 'tuid': return new TuidWrite(parent);
            case 'pending':
                this.error('query中不支持写' + key + '操作');
                break;
            case 'page':
                let stat = new SelectStatement(parent);
                stat.into = '$page';
                return stat;
        }
    }
}

export class PQueryStatement extends PQueryBaseStatement {
}

export class PBusQueryStatement extends PQueryBaseStatement {
}

export class PSheetStatement extends PActionBaseStatement {
    protected statementFromKey(parent: Statement, key: string): Statement {
        let ret: Statement;
        switch (key) {
            default: ret = super.statementFromKey(parent, key); break;
            //case 'book': return new BookWrite();
            //case 'history': return new HistoryWrite();
            //case 'tuid': return new TuidWrite();
            //case 'bus': return new Bus();
            case 'state': ret = new StateToStatement(parent); break;
        }
        if (ret !== undefined) ret.inSheet = true;
        return ret;
    }
}

export class PSheetVerifyStatement extends PStatements {
    private hasReturns: boolean
    constructor(statements: Statements, context: PContext, hasReturns: boolean) {
        super(statements, context);
        this.hasReturns = hasReturns;
    }
    protected statementFromKey(parent: Statement, key: string): Statement {
        let ret: Statement;
        switch (key) {
            default: ret = super.statementFromKey(parent, key); break;
            case 'fail':
                if (this.hasReturns === true) return;
                ret = new FailStatement(parent);
                break;
        }
        if (ret !== undefined) ret.inSheet = true;
        return ret;
    }
}

class StatementsSpace extends Space {
    private scanedStatements: Statement[] = [];
    scanedStatement(statement: Statement) {
        this.scanedStatements.push(statement);
    }
    protected _getEntityTable(name: string): Entity & Table {
        for (let s of this.scanedStatements) {
            let table = s.getTableFromName(name);
            if (table !== undefined) return table;
        }
    }
    protected _getTableByAlias(alias: string): Table {
        for (let s of this.scanedStatements) {
            let table = s.getTableFromAlias(alias);
            if (table !== undefined) return table;
        }
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        for (let s of this.scanedStatements) {
            let v = s.getVar(name);
            if (v !== undefined) {
                return v.pointer;
            }
        }
        return undefined;
    }
}
