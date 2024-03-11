import { ExpCmp, ExpVal } from './exp';
import { SqlBuilder } from './sqlBuilder';
import { Select } from './select';
import { Field, DataType, Entity, VarPointer, SetEqu, TableVar, ProcParamType, Index } from '../../il';

export interface Statement {
    declare(vars: { [name: string]: Field }, puts: { [name: string]: boolean }): void;
    to(sb: SqlBuilder, tab: number): void;
}

export class StatementBase implements Statement {
    declare(vars: { [name: string]: Field }, puts: { [name: string]: boolean }) { }
    to(sb: SqlBuilder, tab: number) { }
}
export class Statements {
    statements: Statement[] = [];
    add(...statement: Statement[]) {
        if (statement === undefined) return;
        this.statements.push(...statement);
    }
    declare(vars: { [name: string]: Field }, puts: { [name: string]: boolean }) {
        for (let s of this.statements) {
            if (s === undefined) continue;
            s.declare(vars, puts);
        }
    }
    body(sb: SqlBuilder, tab: number) {
        for (let s of this.statements) {
            if (s === undefined) continue;
            s.to(sb, tab);
        }
    }
}

export interface ElseIf {
    cmp: ExpCmp;
    statements: Statements;
}
export abstract class If extends StatementBase {
    cmp: ExpCmp;
    private _then: Statements = new Statements();
    private _else: Statements;
    private _elseIfs: ElseIf[];

    protected abstract nop(sb: SqlBuilder, tab: number): void;
    then(...stats: Statement[]) { this._then.add(...stats) }
    else(...stat: Statement[]) {
        if (!stat) return;
        if (this._else === undefined) this._else = new Statements;
        this._else.add(...stat);
    }
    elseIf(cmp: ExpCmp, statements: Statements) {
        if (this._elseIfs === undefined) this._elseIfs = [];
        this._elseIfs.push({
            cmp: cmp,
            statements: statements,
        });
    }

    get thenStatements() { return this._then.statements; }
    get elseStatements() { return this._else?.statements; }

    declare(vars: { [name: string]: Field }, puts: { [name: string]: boolean }) {
        this._then.declare(vars, puts);
        this._elseIfs?.forEach(v => v.statements.declare(vars, puts));
        this._else?.declare(vars, puts);
    }
    to(sb: SqlBuilder, tab: number) {
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

    protected abstract start(sb: SqlBuilder, tab: number): void;
    protected abstract elsePart(sb: SqlBuilder, tab: number): void;
    protected abstract elseIfPart(sb: SqlBuilder, tab: number, elseIf: ElseIf): void;
    protected abstract end(sb: SqlBuilder, tab: number): void;
}

export abstract class While extends StatementBase {
    no: number = 1;     // statement 编号
    cmp: ExpCmp;
    statements: Statements = new Statements;
    declare(vars: { [name: string]: Field }, puts: { [name: string]: boolean }) {
        this.statements.declare(vars, puts);
    }
    to(sb: SqlBuilder, tab: number) {
        this.start(sb, tab);
        this.statements.body(sb, tab + 1);
        this.end(sb, tab);
    }
    protected abstract start(sb: SqlBuilder, tab: number): void;
    protected abstract end(sb: SqlBuilder, tab: number): void;
}

export abstract class Declare extends StatementBase {
    protected _vars: { [name: string]: Field } = {};
    protected _puts: { [name: string]: boolean };
    vars(...vars: Field[]) {
        for (let v of vars) {
            this._vars[v.name] = v;
        }
        return this;
    }
    var(name: string, dt: DataType) {
        let v = new Field();
        v.name = name;
        v.dataType = dt;
        this._vars[name] = v;
        return this;
    }
    put(name: string) {
        if (this._puts === undefined) {
            this._puts = {};
        }
        this._puts[name] = true;
    }
    declare(vars: { [name: string]: Field }, puts: { [name: string]: boolean }) {
        for (let i in this._vars) vars[i] = this._vars[i];
        if (this._puts !== undefined) {
            for (let i in this._puts) puts[i] = true;
        }
    }
}

export abstract class LeaveProc extends StatementBase {
    withCommit: boolean;
}

export abstract class ReturnBegin extends StatementBase {
}

export abstract class ReturnEnd extends StatementBase {
}

export abstract class Return extends StatementBase {
    expVal: ExpVal;
    returnVar: string;
}

export abstract class Break extends StatementBase {
    forQueueNo: string;
    no: number;
}

export abstract class Continue extends StatementBase {
    forQueueNo: string;
    no: number;
}

export abstract class SetTableSeed extends StatementBase {
    table: ExpVal;
    seed: ExpVal;
}

export abstract class GetTableSeed extends StatementBase {
    table: ExpVal;
    seed: ExpVal;
}

export abstract class Transaction extends StatementBase {
}

export abstract class Commit extends StatementBase {
}

export abstract class RollBack extends StatementBase {
}

export abstract class Inline extends StatementBase {
    dbType: string;
    code: string;
    memo: string;
}

export abstract class Singal extends StatementBase {
    text: ExpVal;
}

export abstract class Sleep extends StatementBase {
    value: ExpVal;
}

export abstract class BlockBegin extends StatementBase {
    label: string;
}

export abstract class BlockEnd extends StatementBase {
    label: string;
}

export abstract class SetUTCTimezone extends StatementBase {
}

export abstract class UqsMessageQueue extends StatementBase {
}

export abstract class Set extends StatementBase {
    protected var: string;
    protected exp: ExpVal;
    isAtVar: boolean = false;
    equ(v: string, exp: ExpVal) {
        this.var = v;
        this.exp = exp;
    }
}

export abstract class VarTable extends StatementBase {
    name: string;
    fields: Field[];
    keys: Field[];
    indexes: Index[];
    noDrop: boolean;
    abstract declare(vars: { [name: string]: Field }, puts: { [name: string]: boolean }): void;
    to(sb: SqlBuilder, tab: number) { }
}

export abstract class ForTable extends StatementBase {
    name: string;
    fields: Field[];
    keys: Field[];
    abstract declare(vars: { [name: string]: Field }, puts: { [name: string]: boolean }): void;
    to(sb: SqlBuilder, tab: number) { }
}

export interface ColVal {
    alias?: string;
    col: string;
    val: ExpVal;
    setEqu?: SetEqu;
}
export abstract class SqlTable {
    // protected abstract get name(): string;
    addJoinOn(sb: SqlBuilder) { }
    abstract to(sb: SqlBuilder): void;
    get alias(): string { return; }
    hasUnit: boolean = false;
}
export class SqlVarTable extends SqlTable {
    protected readonly name: string;
    constructor(name: string) { super(); this.name = name }
    to(sb: SqlBuilder) { sb.dbName().dot().var(this.name) }
}
export class SqlSysTable extends SqlTable {
    protected readonly name: string;
    constructor(name: string) { super(); this.name = name }
    to(sb: SqlBuilder) { sb.fld(sb.twProfix + this.name) }
}
export class SqlEntityTable extends SqlTable {
    private entity: Entity | string | TableVar;
    private _alias: string;
    constructor(entity: Entity | string | TableVar, alias: string, hasUnit: boolean) {
        super();
        this.hasUnit = hasUnit;
        this.entity = entity;
        this._alias = alias;
    }
    protected get name(): string {
        return typeof (this.entity) === 'string' ? this.entity : this.entity.name
    }
    addJoinOn(sb: SqlBuilder) {
        if (this.hasUnit === false) return;
        sb.append(' AND ').aliasDot(this._alias).fld('$unit').append('=').var('$unit');
    }
    to(sb: SqlBuilder) {
        if (this.entity === undefined) {
            sb.append(this._alias);
        }
        else {
            sb.entityTable(this.name);
        }
    }
    get alias(): string { return this._alias; }
}
export abstract class Insert extends StatementBase {
    table: SqlTable;
    cols: ColVal[] = [];
    select: Select;
    ignore: boolean = false;
}

export abstract class Update extends StatementBase {
    table: SqlTable | SqlTable[];
    cols: ColVal[] = [];
    where: ExpCmp;
}
export abstract class Upsert extends StatementBase {
    table: SqlTable;
    cols: ColVal[] = [];
    keys: ColVal[] = [];
    select: Select;
}
export interface ColValUpdate extends ColVal {
    update?: ExpVal;
}
export abstract class InsertOnDuplicate extends StatementBase {
    table: SqlTable;
    cols: ColValUpdate[] = [];
    keys: ColVal[] = [];
}
export interface CallParam {
    paramType?: ProcParamType;
    value: ExpVal;
}
export abstract class Call extends StatementBase {
    db: string;
    procName: string;
    procNameExp: ExpVal;
    params: CallParam[] = [];
}

export abstract class ExecSql extends StatementBase {
    toVar: string;
    toVarPoint: VarPointer;
    sql: ExpVal;
    parameters: ExpVal[];
    no: number;
}

export abstract class Prepare extends StatementBase {
    statementName: string;
    sql: ExpVal;
}

export abstract class ExecutePrepare extends StatementBase {
    statementName: string;
    params: ExpVal[];
}

export abstract class DeallocatePrepare extends StatementBase {
    statementName: string;
}

export abstract class Memo extends StatementBase {
    text: string;
}

export abstract class Log extends StatementBase {
    unit: ExpVal;
    uq: ExpVal;
    subject: ExpVal;
    content: ExpVal;
    isError: boolean;
}
