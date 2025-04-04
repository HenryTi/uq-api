import * as parser from '../../parser';
import { Expression, CompareExpression, ValueExpression } from '../Exp';
import { IElement } from '../IElement';
import { DataType } from '../datatype';
import {
    Entity, History, Tuid, Busable, Bus, Pending,
    InBusAction, TuidArr, Proc, BookBase, Queue
} from '../entity';
import { Table, Field, ProcParamType, bigIntField } from '../field';
import { FieldPointer, Pointer, NamePointer, VarPointer } from '../pointer';
import { Builder } from '../builder';
import { Select, Delete, CTE } from '../select';
import { FaceDataType } from '../busSchema';
import { BinStateAct, BizAct, BizBinAct, BizInAct } from '../Biz';
import { SetEqu } from '../tool';
import { PActionStatement, PBusAcceptStatement, PBusQueryStatement, PQueryStatement, PUqStatement } from '../../parser/PStatement';

export abstract class Statement extends IElement {
    protected readonly parent: Statement;
    constructor(parent: Statement) {
        super();
        this.parent = parent;
    }

    level: number;
    no: number;
    setNo(no: number) { this.no = no; }
    get type(): string { return 'statement'; }

    inSheet: boolean;
    getTableFromName(name: string): Entity & Table { return; }
    getTableFromAlias(alias: string): Table { return; }
    getVar(name: string): Var { return; }
    abstract db(db: Builder): object;

    getLoop(): Statement {
        for (let p = this.parent; p != undefined; p = p.parent) {
            switch (p.type) {
                case 'foreach':
                case 'while':
                    return p as Statement;
            }
        }
        return undefined;
    }
}

export abstract class Statements extends Statement {
    get type(): string { return 'statements'; }

    statements: Statement[] = [];
    //getStatements():Statement[] 
    abstract parser(context: parser.PContext): parser.PElement;

    eachChild(callback: (el: IElement, name: string) => void) {
        this.statements.forEach(statement => {
            callback(statement, undefined);
        });
    }
    createStatements: (parent: Statement) => Statements;
    addStatement(statement: Statement) {
        this.statements.push(statement);
    }
}

abstract class ActionBaseStatement extends Statements {
    parser(context: parser.PContext) {
        return new PActionStatement(this, context);
    }
    db(db: Builder): object { return; }
}

export class ActionStatement extends ActionBaseStatement {
    constructor(parent: Statement = undefined) {
        super(parent);
    }
    get type(): string { return 'actionstatement'; }
    createStatements = (parent: Statement) => { return new ActionStatement(parent); }
}

export class UqStatement extends Statements {
    get type(): string { return 'uqstatement'; }
    parser(context: parser.PContext) {
        return new PUqStatement(this, context);
    }
    db(db: Builder): object { return; }
    createStatements = (parent: Statement) => { return new UqStatement(parent); }
}

export class InBusActionStatement extends ActionBaseStatement {
    private entity: InBusAction;
    constructor(parent: Statement, entity: InBusAction) {
        super(parent);
        this.entity = entity;
    }
    get type(): string { return 'inbusactionstatement'; }
    createStatements = (parent: Statement) => { return new InBusActionStatement(parent, this.entity); }
}


export class FunctionStatement extends ActionBaseStatement {
    get type(): string { return 'functionstatement'; }
    createStatements = (parent: Statement) => { return new FunctionStatement(parent); }
}

export class BusAcceptStatement extends Statements {
    private busable: Busable;
    constructor(parent: Statement, busable: Busable) {
        super(parent);
        this.busable = busable;
    }
    get type(): string { return 'busacceptstatement'; }
    parser(context: parser.PContext) {
        return new PBusAcceptStatement(this, context);
    }
    createStatements = (parent: Statement) => { return new BusAcceptStatement(parent, this.busable); }
    db(db: Builder): object { return; }
}
export class QueryBaseStatement extends Statements {
    get type(): string { return 'querystatement'; }
    parser(context: parser.PContext) {
        return new PQueryStatement(this, context);
    }
    createStatements = (parent: Statement) => { return new QueryStatement(parent); }
    db(db: Builder): object { return; }
}
export class BusQueryStatement extends QueryBaseStatement {
    private busable: Busable;
    constructor(parent: Statement, busable: Busable) {
        super(parent);
        this.busable = busable;
    }
    get type(): string { return 'busacceptstatement'; }
    parser(context: parser.PContext) {
        return new PBusQueryStatement(this, context);
    }
    createStatements = (parent: Statement) => { return new BusQueryStatement(parent, this.busable); }
    db(db: Builder): object { return; }
}
export class QueryStatement extends QueryBaseStatement {
    get type(): string { return 'querystatement'; }
    parser(context: parser.PContext) {
        return new PQueryStatement(this, context);
    }
    createStatements = (parent: Statement) => { return new QueryStatement(parent); }
    db(db: Builder): object { return; }
}

export class BizBinActStatements extends Statements {
    private readonly bizAct: BizBinAct;
    constructor(parent: Statement, bizAct: BizBinAct) {
        super(parent);
        this.bizAct = bizAct;
    }
    get type(): string { return 'bizactstatement'; }
    parser(context: parser.PContext) {
        return new parser.PBizBinActStatements(this, context, this.bizAct);
    }
    createStatements = (parent: Statement) => {
        return new BizBinActStatements(parent, this.bizAct);
    }
    db(db: Builder): object { return; }
}

export class BinStateActStatements extends Statements {
    private readonly bizAct: BinStateAct;
    constructor(parent: Statement, bizAct: BinStateAct) {
        super(parent);
        this.bizAct = bizAct;
    }
    get type(): string { return 'bizactstatement'; }
    parser(context: parser.PContext) {
        return new parser.PBinStateActStatements(this, context, this.bizAct);
    }
    createStatements = (parent: Statement) => {
        return new BinStateActStatements(parent, this.bizAct);
    }
    db(db: Builder): object { return; }
}

export class BizInActStatements extends Statements {
    private readonly bizAct: BizInAct;
    constructor(parent: Statement, bizAct: BizInAct) {
        super(parent);
        this.bizAct = bizAct;
    }
    get type(): string { return 'bizactstatement'; }
    parser(context: parser.PContext) {
        return new parser.PBizInActStatements(this, context, this.bizAct);
    }
    createStatements = (parent: Statement) => {
        return new BizInActStatements(parent, this.bizAct);
    }
    db(db: Builder): object { return; }
}

export class Var {
    readonly name: string;
    readonly dataType: DataType;
    readonly exp: Expression;
    pointer: NamePointer;   // scan之后才有的
    constructor(name: string, dataType: DataType, exp?: Expression) {
        this.name = name;
        this.dataType = dataType;
        this.exp = exp;
        this.pointer = new VarPointer(this);
    }
    varName() {
        return this.pointer.varName(this.name);
    }
}

export class VarStatement extends Statement {
    get type(): string { return 'var'; }
    vars: Var[] = [];
    select: Select;
    db(db: Builder): object { return db.varStatement(this); }
    setNo(no: number) {
        super.setNo(no);
        // this.no = no; 
    }
    parser(context: parser.PContext) { return new parser.PVarStatement(this, context); }
    getVar(name: string): Var { return this.vars.find(v => v.name === name); }
}

export interface LocalTableBase {
    name: string;
    jName: string;
    sName: string;
    fields: Field[];
    needTable: boolean,
    keys?: Field[];
}

export interface LocalTable extends LocalTableBase {
    getTableAlias(): string;
    getTableName(): string;
    getKeys(): Field[];
    getFields(): Field[];
    getArrTable(arr: string): Table;
    fieldPointer(name: string): Pointer;
    getField(name: string): Field;
}

export class TableVar implements LocalTable {
    get type(): string { return 'tablevar'; }
    name: string;
    jName: string;
    get sName(): string { return this.jName || this.name; }
    fields: Field[] = [];
    keys: Field[];
    needTable = true;
    getTableAlias(): string { return };
    getTableName() { return this.name; }
    getKeys() { return this.keys }
    getFields() { return this.fields }
    getArrTable(arr: string): Table { return; }
    fieldPointer(name: string): Pointer {
        if (this.keys.find(f => f.name === name) !== undefined)
            return new FieldPointer();
        return this.fields.find(f => f.name === name) !== undefined ?
            new FieldPointer() : undefined;
    };
    getField(name: string): Field {
        let f = this.keys.find(f => f.name === name);
        if (f !== undefined) return f;
        return this.fields.find(f => f.name === name);
    }
}


export class CTETable extends TableVar {
    private readonly cte: CTE;
    /*
    readonly fields: Field[];
    readonly name: string;
    readonly jName: string;
    readonly needTable: boolean;
    */
    constructor(cte: CTE) {
        super();
        this.cte = cte;
        this.fields = cte.select.columns.map(v => {
            return bigIntField(v.alias);
        });
        this.name = this.jName = cte.alias;
        this.needTable = false;
    }
    getTableAlias(): string {
        return this.cte.alias;
    }
    getTableName(): string {
        return this.cte.alias;
    }
    fieldPointer(name: string): Pointer {
        if (this.fields.findIndex(v => v.name === name) >= 0) {
            return new FieldPointer();
        }
    }
    getField(name: string): Field {
        return this.fields.find(f => f.name === name);
    }
    getKeys(): Field[] {
        return [];
    }
    getFields(): Field[] {
        return this.fields;
    }
    getArrTable(arr: string): Table {
        return undefined;
    }
}

export class TableStatement extends Statement {
    table: TableVar = new TableVar();
    noDrop: boolean;
    get type(): string { return 'table'; }
    db(db: Builder): object { return db.tableStatement(this); }
    parser(context: parser.PContext) { return new parser.PTableStatement(this, context); }
}
export interface JsonTableColumn {
    field: Field;
    path: string;
}
// split text into table
export class TextStatement extends Statement {
    textVar: string;
    tableVar: TableVar;
    sep: string;
    ln: string;
    get type(): string { return 'text'; }
    db(db: Builder): object { return db.textStatement(this); }
    parser(context: parser.PContext) { return new parser.PTextStatement(this, context); }
}

export class SettingStatement extends Statement {
    isGlobal: boolean = false;
    addUnit: boolean = false;
    name: string;
    var: Var;
    val: ValueExpression;
    dataType: DataType;
    get type(): string { return 'setting'; }
    db(db: Builder): object { return db.settingStatement(this); }
    parser(context: parser.PContext) { return new parser.PSettingStatement(this, context); }
}

export interface ElseIf {
    condition: CompareExpression;
    statements: Statements;
}

export class If extends Statement {
    get type(): string { return 'if'; }
    condition: CompareExpression;
    then: Statements;
    else: Statements;
    elseIfs: ElseIf[];

    db(db: Builder): object { return db.ifStatement(this) }
    parser(context: parser.PContext) { return new parser.PIf(this, context); }
    eachChild(callback: (el: IElement, name: string) => void) {
        this.then.eachChild((child, cName) => callback(child, cName));
        if (this.else !== undefined) {
            this.else.eachChild((child, cName) => callback(child, cName));
        }
    }
}

export class While extends Statement {
    get type(): string { return 'while'; }
    condition: CompareExpression;
    statements: Statements;

    db(db: Builder): object { return db.whileStatement(this) }
    parser(context: parser.PContext) { return new parser.PWhile(this, context); }
    eachChild(callback: (el: IElement, name: string) => void) {
        this.statements.eachChild((child, cName) => callback(child, cName));
    }
}

abstract class InloopStatement extends Statement {
    loop: Statement;
    setLoop() {
        this.loop = this.getLoop();
    }
}

export class BreakStatement extends InloopStatement {
    get type(): string { return 'break'; }
    db(db: Builder): object { return db.breakStatement(this) }
    parser(context: parser.PContext) { return new parser.PBreakStatement(this, context); }
}

export class ContinueStatement extends InloopStatement {
    get type(): string { return 'continue'; }
    db(db: Builder): object { return db.continueStatement(this) }
    parser(context: parser.PContext) { return new parser.PContinueStatement(this, context); }
}

export class ReturnStatement extends Statement {
    exp: ValueExpression;
    get type(): string { return 'return'; }
    db(db: Builder): object { return db.returnStatement(this) }
    parser(context: parser.PContext) { return new parser.PReturnStatement(this, context); }
}

export interface ProcParam {
    paramType: ProcParamType;
    value: ValueExpression;
}
export class ProcStatement extends Statement {
    proc: Proc;
    params: ProcParam[] = [];
    get type(): string { return 'callproc'; }
    db(db: Builder): object { return db.procStatement(this) }
    parser(context: parser.PContext) { return new parser.PProcStatement(this, context); }
}

export class SelectStatement extends Statement {
    into: string;
    select: Select;
    ignore: boolean;

    get type(): string { return 'select'; }
    db(db: Builder): object { return db.selectStatement(this) }
    parser(context: parser.PContext) { return new parser.PSelectStatement(this, context); }
}

export class DeleteStatement extends Statement {
    del: Delete;
    get type(): string { return 'delete'; }
    db(db: Builder): object { return db.deleteStatement(this) }
    parser(context: parser.PContext) { return new parser.PDeleteStatement(this, context); }
}

export class WriteSet {
    col: string;
    field: Field;
    equ?: SetEqu;
    value: ValueExpression;
}
export class BookWrite extends Statement {
    book: BookBase | TableVar;
    alias: string;
    isPull: boolean;
    at: ValueExpression[] = [];
    set: WriteSet[] = [];
    get type(): string { return 'bookwrite'; }
    db(db: Builder): object { return db.bookWrite(this) }
    parser(context: parser.PContext) { return new parser.PBookWrite(this, context); }
}
/*
export class Pull extends Statement {
    entity: Map | Tuid;
    at: ValueExpression[] = [];
    get type(): string { return 'pull'; }
    db(db: Builder): object { return db.pull(this) }
    parser(context: parser.PContext) { return new parser.PPull(this, context); }
}
*/
export class HistoryWrite extends Statement {
    alias: string;
    history: History;
    date: ValueExpression;
    //of: ValueExpression[] = [];
    set: WriteSet[] = [];
    get type(): string { return 'historywrite'; }
    db(db: Builder): object { return db.historyWrite(this) }
    parser(context: parser.PContext) { return new parser.PHistoryWrite(this, context); }
}

export class TuidWrite extends Statement {
    tuidName: string;
    divName: string;
    tuid: Tuid;
    div: TuidArr;
    into: string;
    isFlagInto: boolean = false;
    intoPointer: NamePointer;
    of: ValueExpression;
    id: ValueExpression;
    unique: ValueExpression[];
    set: WriteSet[] = [];
    get type(): string { return 'tuidwrite'; }
    db(db: Builder): object { return db.tuidWrite(this) }
    parser(context: parser.PContext) { return new parser.PTuidWrite(this, context); }
}

// PENDING Receivable +(customer:1, product:2, pack:2, price:3.5) to recId;
// PENDING Receivable -at recId;
// PENDING Receivable -(price:2.5) at recId done [del|red|cancel|] if 3*2=1;
// select 语句一定要加 done 字段到条件。done=0 pending，done=1 done，done=-1 cancel, done=-2 red
export class PendingWrite extends Statement {
    //pendingName: string;
    alias: string;
    pending: Pending;
    act: '+' | '-' | '=';
    idVar: string;
    idPointer: NamePointer;
    idExp: ValueExpression;
    //fieldVals: {[field:string]: ValueExpression};
    set: WriteSet[] = [];
    doneIf: CompareExpression;
    doneAction: 'del' | 'red' | 'cancel'; // or undefined
    get type(): string { return 'pendingwrite'; }
    db(db: Builder): object { return db.pendingWrite(this) }
    parser(context: parser.PContext) { return new parser.PPendingWrite(this, context); }
}

export class StateToStatement extends Statement {
    to: string;
    get type(): string { return 'stateto'; }
    db(db: Builder): object { return db.stateTo(this) }
    parser(context: parser.PContext) { return new parser.PStateTo(this, context); }
}

export class FailStatement extends Statement {
    get type(): string { return 'fail'; }
    db(db: Builder): object { return db.fail(this) }
    parser(context: parser.PContext) { return new parser.PFail(this, context); }
}

export enum BusAction { Set, Into, To, Local, Query, Stamp, Defer }
export class BusStatement extends Statement {
    bus: Bus;
    busName: string;
    faceName: string;
    arrName: string;
    action: BusAction;
    toUser: ValueExpression;
    defer: 0 | 1;
    stamp: ValueExpression;
    fields: { name: string; type: FaceDataType, value: ValueExpression }[];
    get type(): string { return 'bus'; }
    db(db: Builder): object { return db.busStatement(this) }
    parser(context: parser.PContext) { return new parser.PBusStatement(this, context); }
}

export abstract class SendBaseStatement extends Statement {
    importing: ValueExpression;
}

export abstract class SendMsgStatement extends SendBaseStatement {
    get type(): string { return 'sendMsg'; }
    templet: string;
    isUser: boolean; // isUser，表示 to，cc，bcc 都是注册的 user id
    abstract get method(): string;
    to: ValueExpression;
    cc: ValueExpression;
    bcc: ValueExpression;
    with: { [key: string]: ValueExpression };
    parser(context: parser.PContext): parser.PElement { return }
}

export class SendEmailStatement extends SendMsgStatement {
    get method(): string { return 'email' };
    db(db: Builder): object { return db.sendMsgStatement(this) }
}

export class SendSmsStatement extends SendMsgStatement {
    get method(): string { return 'sms' };
    db(db: Builder): object { return db.sendMsgStatement(this) }
}

export class SendAppStatement extends SendBaseStatement {
    get type(): string { return 'sendApp'; }
    user: ValueExpression;
    app: ValueExpression;
    action: 'add' | 'remove';
    parser(context: parser.PContext): parser.PElement { return }
    db(db: Builder): object { return db.sendAppStatement(this) }
}

export class SendStatement extends Statement {
    send: SendBaseStatement;
    get type(): string { return 'send'; }
    db(db: Builder): object { return this.send.db(db); }
    parser(context: parser.PContext) { return new parser.PSendStatement(this, context); }
}

export class InlineStatement extends Statement {
    dbType: string;
    code: string;
    memo: string;
    get type(): string { return 'inline'; }
    db(db: Builder): object { return db.inlineStatement(this) }
    parser(context: parser.PContext) { return new parser.PInlineStatement(this, context); }
}

export class ScheduleStatement extends Statement {
    act: Proc;			// proc 名字
    params: ValueExpression[];			// act 的参数
    delay: ValueExpression;				// 当下往后延时分钟数
    on: ValueExpression | number;		// 指定时间，time data type。
    repeat: ValueExpression;
    interval: ValueExpression;			// 分钟为单位
    get type(): string { return 'schedule'; }
    db(db: Builder): object { return db.schedule(this) }
    parser(context: parser.PContext) { return new parser.PScheduleStatement(this, context); }
}

export class ExecSqlStatement extends Statement {
    sql: ValueExpression;
    toVar: string;
    toVarPointer: NamePointer;
    get type(): string { return 'execSql'; }
    db(db: Builder): object { return db.execSqlStatement(this) }
    parser(context: parser.PContext) { return new parser.PExecSqlStatement(this, context); }
}

export class LogStatement extends Statement {
    unit: ValueExpression;
    uq: ValueExpression;
    subject: ValueExpression;
    content: ValueExpression;
    isError: boolean;
    get type(): string { return 'log'; }
    db(db: Builder): object { return db.logStatement(this) }
    parser(context: parser.PContext) { return new parser.PLogStatement(this, context); }
}

export enum EnumRole { none = 0, Admin = 1, Owner = 2 };
export class RoleStatement extends Statement {
    valSite: ValueExpression;
    valUser: ValueExpression;
    action: 'add' | 'del' | 'clear' | 'assert';
    valOwner: ValueExpression;
    valAdmin: ValueExpression;
    roles: ValueExpression[];
    valAssigned: ValueExpression;
    isAdmin: boolean;
    isOwner: boolean;
    get type(): string { return 'role'; }
    db(db: Builder): object { return db.roleStatement(this) }
    parser(context: parser.PContext) { return new parser.PRoleStatement(this, context); }
}

export class AssertRoleStatement extends RoleStatement {
    parser(context: parser.PContext) { return new parser.PAssertRoleStatement(this, context); }
}

export class SleepStatement extends Statement {
    value: ValueExpression;
    get type(): string { return 'sleep'; }
    db(db: Builder): object { return db.sleepStatement(this) }
    parser(context: parser.PContext) { return new parser.PSleepStatement(this, context); }
}

export enum EnumTransaction { off, start, commit, rollBackOnError }
export class TransactionStatement extends Statement {
    act: EnumTransaction;
    get type(): string { return 'transaction'; }
    db(db: Builder): object { return db.transactionStatement(this) }
    parser(context: parser.PContext) { return new parser.PTransactionStatement(this, context); }
}

export class PokeStatement extends Statement {
    user: ValueExpression;
    get type(): string { return 'poke'; }
    db(db: Builder): object { return db.pokeStatement(this) }
    parser(context: parser.PContext) { return new parser.PPokeStatement(this, context); }
}

export enum QueueAction {
    add, again, done, del
}
export class QueueStatement extends Statement {
    queue: Queue;
    entityId: ValueExpression;          // 也可以是typeof id值
    ix: ValueExpression;
    action: QueueAction;
    value: ValueExpression;
    get type(): string { return 'queue'; }
    db(db: Builder): object { return db.queueStatement(this) }
    parser(context: parser.PContext) { return new parser.PQueueStatement(this, context); }
}


