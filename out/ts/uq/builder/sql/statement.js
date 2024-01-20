"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.Memo = exports.DeallocatePrepare = exports.ExecutePrepare = exports.Prepare = exports.ExecSql = exports.Call = exports.InsertOnDuplicate = exports.Upsert = exports.Update = exports.Insert = exports.SqlEntityTable = exports.SqlSysTable = exports.SqlVarTable = exports.SqlTable = exports.ForTable = exports.VarTable = exports.Set = exports.UqsMessageQueue = exports.SetUTCTimezone = exports.BlockEnd = exports.BlockBegin = exports.Sleep = exports.Singal = exports.Inline = exports.RollBack = exports.Commit = exports.Transaction = exports.GetTableSeed = exports.SetTableSeed = exports.Continue = exports.Break = exports.Return = exports.ReturnEnd = exports.ReturnBegin = exports.LeaveProc = exports.Declare = exports.While = exports.If = exports.Statements = exports.StatementBase = void 0;
const il_1 = require("../../il");
class StatementBase {
    declare(vars, puts) { }
    to(sb, tab) { }
}
exports.StatementBase = StatementBase;
class Statements {
    constructor() {
        this.statements = [];
    }
    add(...statement) {
        if (statement === undefined)
            return;
        this.statements.push(...statement);
    }
    declare(vars, puts) {
        for (let s of this.statements) {
            if (s === undefined)
                continue;
            s.declare(vars, puts);
        }
    }
    body(sb, tab) {
        for (let s of this.statements) {
            if (s === undefined)
                continue;
            s.to(sb, tab);
        }
    }
}
exports.Statements = Statements;
class If extends StatementBase {
    constructor() {
        super(...arguments);
        this._then = new Statements();
    }
    then(...stats) { this._then.add(...stats); }
    else(stat) {
        if (!stat)
            return;
        if (this._else === undefined)
            this._else = new Statements;
        this._else.add(stat);
    }
    elseIf(cmp, statements) {
        if (this._elseIfs === undefined)
            this._elseIfs = [];
        //let statements = new Statements();
        //statements.add(...stats);
        this._elseIfs.push({
            cmp: cmp,
            statements: statements,
        });
    }
    declare(vars, puts) {
        var _a, _b;
        this._then.declare(vars, puts);
        (_a = this._elseIfs) === null || _a === void 0 ? void 0 : _a.forEach(v => v.statements.declare(vars, puts));
        (_b = this._else) === null || _b === void 0 ? void 0 : _b.declare(vars, puts);
    }
    to(sb, tab) {
        this.start(sb, tab);
        if (this._then.statements.length === 0) {
            this.nop(sb, tab + 1);
        }
        else {
            this._then.body(sb, tab + 1);
        }
        if (this._elseIfs !== undefined) {
            this._elseIfs.forEach(elseIf => {
                this.elseIfPart(sb, tab, elseIf);
                if (elseIf.statements.statements.length === 0) {
                    this.nop(sb, tab + 1);
                }
                else {
                    elseIf.statements.body(sb, tab + 1);
                }
            });
        }
        if (this._else !== undefined) {
            this.elsePart(sb, tab);
            if (this._else.statements.length === 0) {
                this.nop(sb, tab + 1);
            }
            else {
                this._else.body(sb, tab + 1);
            }
        }
        this.end(sb, tab);
    }
}
exports.If = If;
class While extends StatementBase {
    constructor() {
        super(...arguments);
        this.no = 1; // statement 编号
        this.statements = new Statements;
    }
    declare(vars, puts) {
        this.statements.declare(vars, puts);
    }
    to(sb, tab) {
        this.start(sb, tab);
        this.statements.body(sb, tab + 1);
        this.end(sb, tab);
    }
}
exports.While = While;
class Declare extends StatementBase {
    constructor() {
        super(...arguments);
        this._vars = {};
    }
    vars(...vars) {
        for (let v of vars) {
            this._vars[v.name] = v;
        }
        return this;
    }
    var(name, dt) {
        let v = new il_1.Field();
        v.name = name;
        v.dataType = dt;
        this._vars[name] = v;
        return this;
    }
    put(name) {
        if (this._puts === undefined) {
            this._puts = {};
        }
        this._puts[name] = true;
    }
    declare(vars, puts) {
        for (let i in this._vars)
            vars[i] = this._vars[i];
        if (this._puts !== undefined) {
            for (let i in this._puts)
                puts[i] = true;
        }
    }
}
exports.Declare = Declare;
class LeaveProc extends StatementBase {
}
exports.LeaveProc = LeaveProc;
class ReturnBegin extends StatementBase {
}
exports.ReturnBegin = ReturnBegin;
class ReturnEnd extends StatementBase {
}
exports.ReturnEnd = ReturnEnd;
class Return extends StatementBase {
}
exports.Return = Return;
class Break extends StatementBase {
}
exports.Break = Break;
class Continue extends StatementBase {
}
exports.Continue = Continue;
class SetTableSeed extends StatementBase {
}
exports.SetTableSeed = SetTableSeed;
class GetTableSeed extends StatementBase {
}
exports.GetTableSeed = GetTableSeed;
class Transaction extends StatementBase {
}
exports.Transaction = Transaction;
class Commit extends StatementBase {
}
exports.Commit = Commit;
class RollBack extends StatementBase {
}
exports.RollBack = RollBack;
class Inline extends StatementBase {
}
exports.Inline = Inline;
class Singal extends StatementBase {
}
exports.Singal = Singal;
class Sleep extends StatementBase {
}
exports.Sleep = Sleep;
class BlockBegin extends StatementBase {
}
exports.BlockBegin = BlockBegin;
class BlockEnd extends StatementBase {
}
exports.BlockEnd = BlockEnd;
class SetUTCTimezone extends StatementBase {
}
exports.SetUTCTimezone = SetUTCTimezone;
class UqsMessageQueue extends StatementBase {
}
exports.UqsMessageQueue = UqsMessageQueue;
class Set extends StatementBase {
    constructor() {
        super(...arguments);
        this.isAtVar = false;
    }
    equ(v, exp) {
        this.var = v;
        this.exp = exp;
    }
}
exports.Set = Set;
class VarTable extends StatementBase {
    to(sb, tab) { }
}
exports.VarTable = VarTable;
class ForTable extends StatementBase {
    to(sb, tab) { }
}
exports.ForTable = ForTable;
class SqlTable {
    constructor() {
        this.hasUnit = false;
    }
    // protected abstract get name(): string;
    addJoinOn(sb) { }
    get alias() { return; }
}
exports.SqlTable = SqlTable;
class SqlVarTable extends SqlTable {
    constructor(name) { super(); this.name = name; }
    to(sb) { sb.var(this.name); }
}
exports.SqlVarTable = SqlVarTable;
class SqlSysTable extends SqlTable {
    constructor(name) { super(); this.name = name; }
    to(sb) { sb.fld(sb.twProfix + this.name); }
}
exports.SqlSysTable = SqlSysTable;
class SqlEntityTable extends SqlTable {
    constructor(entity, alias, hasUnit) {
        super();
        this.hasUnit = hasUnit;
        this.entity = entity;
        this._alias = alias;
    }
    get name() {
        return typeof (this.entity) === 'string' ? this.entity : this.entity.name;
    }
    addJoinOn(sb) {
        if (this.hasUnit === false)
            return;
        sb.append(' AND ').aliasDot(this._alias).fld('$unit').append('=').var('$unit');
    }
    to(sb) {
        if (this.entity === undefined) {
            sb.append(this._alias);
        }
        else {
            sb.entityTable(this.name);
        }
    }
    get alias() { return this._alias; }
}
exports.SqlEntityTable = SqlEntityTable;
class Insert extends StatementBase {
    constructor() {
        super(...arguments);
        this.cols = [];
        this.ignore = false;
    }
}
exports.Insert = Insert;
class Update extends StatementBase {
    constructor() {
        super(...arguments);
        this.cols = [];
    }
}
exports.Update = Update;
class Upsert extends StatementBase {
    constructor() {
        super(...arguments);
        this.cols = [];
        this.keys = [];
    }
}
exports.Upsert = Upsert;
class InsertOnDuplicate extends StatementBase {
    constructor() {
        super(...arguments);
        this.cols = [];
        this.keys = [];
    }
}
exports.InsertOnDuplicate = InsertOnDuplicate;
class Call extends StatementBase {
    constructor() {
        super(...arguments);
        this.params = [];
    }
}
exports.Call = Call;
class ExecSql extends StatementBase {
}
exports.ExecSql = ExecSql;
class Prepare extends StatementBase {
}
exports.Prepare = Prepare;
class ExecutePrepare extends StatementBase {
}
exports.ExecutePrepare = ExecutePrepare;
class DeallocatePrepare extends StatementBase {
}
exports.DeallocatePrepare = DeallocatePrepare;
class Memo extends StatementBase {
}
exports.Memo = Memo;
class Log extends StatementBase {
}
exports.Log = Log;
//# sourceMappingURL=statement.js.map