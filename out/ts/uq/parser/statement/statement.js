"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSheetVerifyStatement = exports.PSheetStatement = exports.PBusQueryStatement = exports.PQueryStatement = exports.PQueryBaseStatement = exports.PBusAcceptStatement = exports.PActionStatement = exports.PUqStatement = exports.PStatements = exports.PStatement = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const space_1 = require("../space");
const tokens_1 = require("../tokens");
class PStatement extends element_1.PElement {
    constructor(statement, context) {
        super(statement, context);
        this.statement = statement;
    }
}
exports.PStatement = PStatement;
class PStatements extends PStatement {
    constructor(statements, context) {
        super(statements, context);
        this.statements = statements;
    }
    _parse() {
        if (this.ts.token === tokens_1.Token.LBRACE) {
            this.ts.readToken();
            for (;;) {
                while (this.ts.token === tokens_1.Token.SEMICOLON)
                    this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RBRACE) {
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
    statementFromKey(parent, key) {
        switch (key) {
            case 'var':
                return new il_1.VarStatement(parent);
            case 'table':
                return new il_1.TableStatement(parent);
            case 'text':
                return new il_1.TextStatement(parent);
            case 'set':
                return new il_1.SetStatement(parent);
            case 'with':
                return new il_1.WithStatement(parent);
            case 'value':
                return new il_1.ValueStatement(parent);
            case 'if': return new il_1.If(parent);
            case 'while': return new il_1.While(parent);
            case 'for':
            case 'foreach': return new il_1.ForEach(parent);
            case 'continue': return new il_1.ContinueStatement(parent);
            case 'break': return new il_1.BreakStatement(parent);
            case 'proc': return new il_1.ProcStatement(parent);
            case 'return': return new il_1.ReturnStatement(parent);
            case 'setting': return new il_1.SettingStatement(parent);
            case 'into':
                this.ts.readToken();
                let ignore = false;
                if (this.ts.isKeyword('ignore') === true) {
                    ignore = true;
                    this.ts.readToken();
                }
                if (this.ts.token !== tokens_1.Token.VAR)
                    this.ts.expect('return表名');
                let statement = new il_1.SelectStatement(parent);
                let v1 = this.ts.lowerVar;
                if (this.ts.peekToken() === tokens_1.Token.DOT) {
                    this.ts.readToken();
                    this.ts.readToken();
                    if (this.ts.token !== tokens_1.Token.VAR)
                        this.ts.expectToken(tokens_1.Token.VAR);
                    v1 += '.' + this.ts.lowerVar;
                }
                statement.into = v1;
                statement.ignore = ignore;
                return statement;
            case 'delete': return new il_1.DeleteStatement(parent);
            case 'log': return new il_1.LogStatement(parent);
            case 'transaction':
            case 'trans': return new il_1.TransactionStatement(parent);
            case 'poke': return new il_1.PokeStatement(parent);
            case 'sleep': return new il_1.SleepStatement(parent);
            case 'execsql': return new il_1.ExecSqlStatement(parent);
            case 'role': return new il_1.RoleStatement(parent);
            case 'assert':
                this.ts.readToken();
                if (this.ts.isKeyword('role') === true) {
                    // this.ts.readToken();
                    return new il_1.AssertRoleStatement(parent);
                }
                else {
                    this.ts.expect('role');
                }
                break;
        }
    }
    parseStatement() {
        while (this.ts.token === tokens_1.Token.SEMICOLON)
            this.ts.readToken();
        let statement;
        if (this.ts.token === tokens_1.Token.CODE) {
            statement = new il_1.InlineStatement(this.statements);
        }
        else if (this.ts.token === tokens_1.Token.VAR) {
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
        parser.parse();
        this.statements.addStatement(statement);
    }
    preScan(space) {
        let ok = true;
        this.statements.eachChild((s, name) => {
            if (s.pelement.preScan(space) === false)
                ok = false;
        });
        return ok;
    }
    scan(space) {
        let ok = true;
        let theSpace = new StatementsSpace(space);
        let no = theSpace.newStatementNo() + 1;
        this.statements.setNo(no);
        theSpace.setStatementNo(no);
        this.statements.eachChild((s, name) => {
            no = theSpace.newStatementNo() + 1;
            s.setNo(no);
            theSpace.setStatementNo(no);
            if (s.pelement.scan(theSpace) === false)
                ok = false;
            theSpace.scanedStatement(s);
        });
        return ok;
    }
    scan2(uq) {
        for (let stat of this.statements.statements) {
            let ret = stat.pelement.scan2(uq);
            if (ret === false)
                return false;
        }
        return true;
    }
}
exports.PStatements = PStatements;
class PUqStatement extends PStatements {
    statementFromKey(parent, key) {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'schedule': return new il_1.ScheduleStatement(parent);
        }
    }
}
exports.PUqStatement = PUqStatement;
class PActionBaseStatement extends PStatements {
    statementFromKey(parent, key) {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'book': return new il_1.BookWrite(parent);
            // case 'pull': return new Pull(parent);
            case 'history': return new il_1.HistoryWrite(parent);
            case 'pending': return new il_1.PendingWrite(parent);
            case 'tuid': return new il_1.TuidWrite(parent);
            case 'sheet': return new il_1.SheetWrite(parent);
            case 'bus': return new il_1.BusStatement(parent);
            case 'send': return new il_1.SendStatement(parent);
            case 'schedule': return new il_1.ScheduleStatement(parent);
            case 'queue': return new il_1.QueueStatement(parent);
            case 'biz':
                return new il_1.BizDetailActStatement(parent /*, this.bizDetailAct*/);
        }
    }
}
class PActionStatement extends PActionBaseStatement {
}
exports.PActionStatement = PActionStatement;
class PBusAcceptStatement extends PActionBaseStatement {
}
exports.PBusAcceptStatement = PBusAcceptStatement;
class PQueryBaseStatement extends PStatements {
    statementFromKey(parent, key) {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'book': return new il_1.BookWrite(parent);
            case 'history': return new il_1.HistoryWrite(parent);
            case 'tuid': return new il_1.TuidWrite(parent);
            case 'pending':
                this.error('query中不支持写' + key + '操作');
                break;
            case 'page':
                let stat = new il_1.SelectStatement(parent);
                stat.into = '$page';
                return stat;
        }
    }
}
exports.PQueryBaseStatement = PQueryBaseStatement;
class PQueryStatement extends PQueryBaseStatement {
}
exports.PQueryStatement = PQueryStatement;
class PBusQueryStatement extends PQueryBaseStatement {
}
exports.PBusQueryStatement = PBusQueryStatement;
class PSheetStatement extends PActionBaseStatement {
    statementFromKey(parent, key) {
        let ret;
        switch (key) {
            default:
                ret = super.statementFromKey(parent, key);
                break;
            //case 'book': return new BookWrite();
            //case 'history': return new HistoryWrite();
            //case 'tuid': return new TuidWrite();
            //case 'bus': return new Bus();
            case 'state':
                ret = new il_1.StateToStatement(parent);
                break;
        }
        if (ret !== undefined)
            ret.inSheet = true;
        return ret;
    }
}
exports.PSheetStatement = PSheetStatement;
class PSheetVerifyStatement extends PStatements {
    constructor(statements, context, hasReturns) {
        super(statements, context);
        this.hasReturns = hasReturns;
    }
    statementFromKey(parent, key) {
        let ret;
        switch (key) {
            default:
                ret = super.statementFromKey(parent, key);
                break;
            case 'fail':
                if (this.hasReturns === true)
                    return;
                ret = new il_1.FailStatement(parent);
                break;
        }
        if (ret !== undefined)
            ret.inSheet = true;
        return ret;
    }
}
exports.PSheetVerifyStatement = PSheetVerifyStatement;
class StatementsSpace extends space_1.Space {
    constructor() {
        super(...arguments);
        this.scanedStatements = [];
    }
    scanedStatement(statement) {
        this.scanedStatements.push(statement);
    }
    _getEntityTable(name) {
        for (let s of this.scanedStatements) {
            let table = s.getTableFromName(name);
            if (table !== undefined)
                return table;
        }
    }
    _getTableByAlias(alias) {
        for (let s of this.scanedStatements) {
            let table = s.getTableFromAlias(alias);
            if (table !== undefined)
                return table;
        }
    }
    _varPointer(name, isField) {
        for (let s of this.scanedStatements) {
            let v = s.getVar(name);
            if (v !== undefined) {
                return v.pointer;
            }
        }
        return undefined;
    }
}
//# sourceMappingURL=statement.js.map