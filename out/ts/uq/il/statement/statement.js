"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SleepStatement = exports.AssertRoleStatement = exports.RoleStatement = exports.EnumRole = exports.LogStatement = exports.ExecSqlStatement = exports.ScheduleStatement = exports.InlineStatement = exports.SendStatement = exports.SendAppStatement = exports.SendSmsStatement = exports.SendEmailStatement = exports.SendMsgStatement = exports.SendBaseStatement = exports.BusStatement = exports.BusAction = exports.FailStatement = exports.StateToStatement = exports.PendingWrite = exports.TuidWrite = exports.HistoryWrite = exports.BookWrite = exports.WriteSet = exports.DeleteStatement = exports.SelectStatement = exports.ProcStatement = exports.ReturnStatement = exports.ContinueStatement = exports.BreakStatement = exports.While = exports.If = exports.SettingStatement = exports.TextStatement = exports.TableStatement = exports.CTETable = exports.TableVar = exports.VarStatement = exports.Var = exports.BizInActStatements = exports.BizBinActStatements = exports.QueryStatement = exports.BusQueryStatement = exports.QueryBaseStatement = exports.BusAcceptStatement = exports.FunctionStatement = exports.InBusActionStatement = exports.UqStatement = exports.ActionStatement = exports.Statements = exports.Statement = void 0;
exports.QueueStatement = exports.QueueAction = exports.PokeStatement = exports.TransactionStatement = exports.EnumTransaction = void 0;
const parser = require("../../parser");
const IElement_1 = require("../IElement");
const field_1 = require("../field");
const pointer_1 = require("../pointer");
class Statement extends IElement_1.IElement {
    constructor(parent) {
        super();
        this.parent = parent;
    }
    setNo(no) { this.no = no; }
    get type() { return 'statement'; }
    getTableFromName(name) { return; }
    getTableFromAlias(alias) { return; }
    getVar(name) { return; }
    getLoop() {
        for (let p = this.parent; p != undefined; p = p.parent) {
            switch (p.type) {
                case 'foreach':
                case 'while':
                    return p;
            }
        }
        return undefined;
    }
}
exports.Statement = Statement;
class Statements extends Statement {
    constructor() {
        super(...arguments);
        this.statements = [];
    }
    get type() { return 'statements'; }
    eachChild(callback) {
        this.statements.forEach(statement => {
            callback(statement, undefined);
        });
    }
    addStatement(statement) {
        this.statements.push(statement);
    }
}
exports.Statements = Statements;
class ActionBaseStatement extends Statements {
    parser(context) {
        return new parser.PActionStatement(this, context);
    }
    db(db) { return; }
}
class ActionStatement extends ActionBaseStatement {
    constructor(parent = undefined) {
        super(parent);
        this.createStatements = (parent) => { return new ActionStatement(parent); };
    }
    get type() { return 'actionstatement'; }
}
exports.ActionStatement = ActionStatement;
class UqStatement extends Statements {
    constructor() {
        super(...arguments);
        this.createStatements = (parent) => { return new UqStatement(parent); };
    }
    get type() { return 'uqstatement'; }
    parser(context) {
        return new parser.PUqStatement(this, context);
    }
    db(db) { return; }
}
exports.UqStatement = UqStatement;
class InBusActionStatement extends ActionBaseStatement {
    constructor(parent, entity) {
        super(parent);
        this.createStatements = (parent) => { return new InBusActionStatement(parent, this.entity); };
        this.entity = entity;
    }
    get type() { return 'inbusactionstatement'; }
}
exports.InBusActionStatement = InBusActionStatement;
class FunctionStatement extends ActionBaseStatement {
    constructor() {
        super(...arguments);
        this.createStatements = (parent) => { return new FunctionStatement(parent); };
    }
    get type() { return 'functionstatement'; }
}
exports.FunctionStatement = FunctionStatement;
class BusAcceptStatement extends Statements {
    constructor(parent, busable) {
        super(parent);
        this.createStatements = (parent) => { return new BusAcceptStatement(parent, this.busable); };
        this.busable = busable;
    }
    get type() { return 'busacceptstatement'; }
    parser(context) {
        return new parser.PBusAcceptStatement(this, context);
    }
    db(db) { return; }
}
exports.BusAcceptStatement = BusAcceptStatement;
class QueryBaseStatement extends Statements {
    constructor() {
        super(...arguments);
        this.createStatements = (parent) => { return new QueryStatement(parent); };
    }
    get type() { return 'querystatement'; }
    parser(context) {
        return new parser.PQueryStatement(this, context);
    }
    db(db) { return; }
}
exports.QueryBaseStatement = QueryBaseStatement;
class BusQueryStatement extends QueryBaseStatement {
    constructor(parent, busable) {
        super(parent);
        this.createStatements = (parent) => { return new BusQueryStatement(parent, this.busable); };
        this.busable = busable;
    }
    get type() { return 'busacceptstatement'; }
    parser(context) {
        return new parser.PBusQueryStatement(this, context);
    }
    db(db) { return; }
}
exports.BusQueryStatement = BusQueryStatement;
class QueryStatement extends QueryBaseStatement {
    constructor() {
        super(...arguments);
        this.createStatements = (parent) => { return new QueryStatement(parent); };
    }
    get type() { return 'querystatement'; }
    parser(context) {
        return new parser.PQueryStatement(this, context);
    }
    db(db) { return; }
}
exports.QueryStatement = QueryStatement;
class BizBinActStatements extends Statements {
    constructor(parent, bizAct) {
        super(parent);
        this.createStatements = (parent) => {
            return new BizBinActStatements(parent, this.bizAct);
        };
        this.bizAct = bizAct;
    }
    get type() { return 'bizactstatement'; }
    parser(context) {
        return new parser.PBizBinActStatements(this, context, this.bizAct);
    }
    db(db) { return; }
}
exports.BizBinActStatements = BizBinActStatements;
class BizInActStatements extends Statements {
    constructor(parent, bizAct) {
        super(parent);
        this.createStatements = (parent) => {
            return new BizInActStatements(parent, this.bizAct);
        };
        this.bizAct = bizAct;
    }
    get type() { return 'bizactstatement'; }
    parser(context) {
        return new parser.PBizInActStatements(this, context, this.bizAct);
    }
    db(db) { return; }
}
exports.BizInActStatements = BizInActStatements;
class Var {
    constructor(name, dataType, exp) {
        this.name = name;
        this.dataType = dataType;
        this.exp = exp;
    }
    varName() {
        return this.pointer.varName(this.name);
    }
}
exports.Var = Var;
class VarStatement extends Statement {
    constructor() {
        super(...arguments);
        this.vars = [];
    }
    get type() { return 'var'; }
    db(db) { return db.varStatement(this); }
    setNo(no) {
        super.setNo(no);
        // this.no = no; 
    }
    parser(context) { return new parser.PVarStatement(this, context); }
    getVar(name) { return this.vars.find(v => v.name === name); }
}
exports.VarStatement = VarStatement;
class TableVar {
    constructor() {
        this.fields = [];
        this.needTable = true;
    }
    get type() { return 'tablevar'; }
    get sName() { return this.jName || this.name; }
    getTableAlias() { return; }
    ;
    getTableName() { return this.name; }
    getKeys() { return this.keys; }
    getFields() { return this.fields; }
    getArrTable(arr) { return; }
    fieldPointer(name) {
        if (this.keys.find(f => f.name === name) !== undefined)
            return new pointer_1.FieldPointer();
        return this.fields.find(f => f.name === name) !== undefined ?
            new pointer_1.FieldPointer() : undefined;
    }
    ;
    getField(name) {
        let f = this.keys.find(f => f.name === name);
        if (f !== undefined)
            return f;
        return this.fields.find(f => f.name === name);
    }
}
exports.TableVar = TableVar;
class CTETable extends TableVar {
    constructor(cte) {
        super();
        this.cte = cte;
        this.fields = cte.select.columns.map(v => {
            return (0, field_1.bigIntField)(v.alias);
        });
        this.name = this.jName = cte.alias;
        this.needTable = false;
    }
    getTableAlias() {
        return this.cte.alias;
    }
    getTableName() {
        return this.cte.alias;
    }
    fieldPointer(name) {
        if (this.fields.findIndex(v => v.name === name) >= 0) {
            return new pointer_1.FieldPointer();
        }
    }
    getField(name) {
        return this.fields.find(f => f.name === name);
    }
    getKeys() {
        return [];
    }
    getFields() {
        return this.fields;
    }
    getArrTable(arr) {
        return undefined;
    }
}
exports.CTETable = CTETable;
class TableStatement extends Statement {
    constructor() {
        super(...arguments);
        this.table = new TableVar();
    }
    get type() { return 'table'; }
    db(db) { return db.tableStatement(this); }
    parser(context) { return new parser.PTableStatement(this, context); }
}
exports.TableStatement = TableStatement;
// split text into table
class TextStatement extends Statement {
    get type() { return 'text'; }
    db(db) { return db.textStatement(this); }
    parser(context) { return new parser.PTextStatement(this, context); }
}
exports.TextStatement = TextStatement;
class SettingStatement extends Statement {
    constructor() {
        super(...arguments);
        this.isGlobal = false;
        this.addUnit = false;
    }
    get type() { return 'setting'; }
    db(db) { return db.settingStatement(this); }
    parser(context) { return new parser.PSettingStatement(this, context); }
}
exports.SettingStatement = SettingStatement;
class If extends Statement {
    get type() { return 'if'; }
    db(db) { return db.ifStatement(this); }
    parser(context) { return new parser.PIf(this, context); }
    eachChild(callback) {
        this.then.eachChild((child, cName) => callback(child, cName));
        this.else.eachChild((child, cName) => callback(child, cName));
    }
}
exports.If = If;
class While extends Statement {
    get type() { return 'while'; }
    db(db) { return db.whileStatement(this); }
    parser(context) { return new parser.PWhile(this, context); }
    eachChild(callback) {
        this.statements.eachChild((child, cName) => callback(child, cName));
    }
}
exports.While = While;
class InloopStatement extends Statement {
    setLoop() {
        this.loop = this.getLoop();
    }
}
class BreakStatement extends InloopStatement {
    get type() { return 'break'; }
    db(db) { return db.breakStatement(this); }
    parser(context) { return new parser.PBreakStatement(this, context); }
}
exports.BreakStatement = BreakStatement;
class ContinueStatement extends InloopStatement {
    get type() { return 'continue'; }
    db(db) { return db.continueStatement(this); }
    parser(context) { return new parser.PContinueStatement(this, context); }
}
exports.ContinueStatement = ContinueStatement;
class ReturnStatement extends Statement {
    get type() { return 'return'; }
    db(db) { return db.returnStatement(this); }
    parser(context) { return new parser.PReturnStatement(this, context); }
}
exports.ReturnStatement = ReturnStatement;
class ProcStatement extends Statement {
    constructor() {
        super(...arguments);
        this.params = [];
    }
    get type() { return 'callproc'; }
    db(db) { return db.procStatement(this); }
    parser(context) { return new parser.PProcStatement(this, context); }
}
exports.ProcStatement = ProcStatement;
class SelectStatement extends Statement {
    get type() { return 'select'; }
    db(db) { return db.selectStatement(this); }
    parser(context) { return new parser.PSelectStatement(this, context); }
}
exports.SelectStatement = SelectStatement;
class DeleteStatement extends Statement {
    get type() { return 'delete'; }
    db(db) { return db.deleteStatement(this); }
    parser(context) { return new parser.PDeleteStatement(this, context); }
}
exports.DeleteStatement = DeleteStatement;
class WriteSet {
}
exports.WriteSet = WriteSet;
class BookWrite extends Statement {
    constructor() {
        super(...arguments);
        this.at = [];
        this.set = [];
    }
    get type() { return 'bookwrite'; }
    db(db) { return db.bookWrite(this); }
    parser(context) { return new parser.PBookWrite(this, context); }
}
exports.BookWrite = BookWrite;
/*
export class Pull extends Statement {
    entity: Map | Tuid;
    at: ValueExpression[] = [];
    get type(): string { return 'pull'; }
    db(db: Builder): object { return db.pull(this) }
    parser(context: parser.PContext) { return new parser.PPull(this, context); }
}
*/
class HistoryWrite extends Statement {
    constructor() {
        super(...arguments);
        //of: ValueExpression[] = [];
        this.set = [];
    }
    get type() { return 'historywrite'; }
    db(db) { return db.historyWrite(this); }
    parser(context) { return new parser.PHistoryWrite(this, context); }
}
exports.HistoryWrite = HistoryWrite;
class TuidWrite extends Statement {
    constructor() {
        super(...arguments);
        this.isFlagInto = false;
        this.set = [];
    }
    get type() { return 'tuidwrite'; }
    db(db) { return db.tuidWrite(this); }
    parser(context) { return new parser.PTuidWrite(this, context); }
}
exports.TuidWrite = TuidWrite;
// PENDING Receivable +(customer:1, product:2, pack:2, price:3.5) to recId;
// PENDING Receivable -at recId;
// PENDING Receivable -(price:2.5) at recId done [del|red|cancel|] if 3*2=1;
// select 语句一定要加 done 字段到条件。done=0 pending，done=1 done，done=-1 cancel, done=-2 red
class PendingWrite extends Statement {
    constructor() {
        super(...arguments);
        //fieldVals: {[field:string]: ValueExpression};
        this.set = [];
    }
    get type() { return 'pendingwrite'; }
    db(db) { return db.pendingWrite(this); }
    parser(context) { return new parser.PPendingWrite(this, context); }
}
exports.PendingWrite = PendingWrite;
class StateToStatement extends Statement {
    get type() { return 'stateto'; }
    db(db) { return db.stateTo(this); }
    parser(context) { return new parser.PStateTo(this, context); }
}
exports.StateToStatement = StateToStatement;
class FailStatement extends Statement {
    get type() { return 'fail'; }
    db(db) { return db.fail(this); }
    parser(context) { return new parser.PFail(this, context); }
}
exports.FailStatement = FailStatement;
var BusAction;
(function (BusAction) {
    BusAction[BusAction["Set"] = 0] = "Set";
    BusAction[BusAction["Into"] = 1] = "Into";
    BusAction[BusAction["To"] = 2] = "To";
    BusAction[BusAction["Local"] = 3] = "Local";
    BusAction[BusAction["Query"] = 4] = "Query";
    BusAction[BusAction["Stamp"] = 5] = "Stamp";
    BusAction[BusAction["Defer"] = 6] = "Defer";
})(BusAction || (exports.BusAction = BusAction = {}));
class BusStatement extends Statement {
    get type() { return 'bus'; }
    db(db) { return db.busStatement(this); }
    parser(context) { return new parser.PBusStatement(this, context); }
}
exports.BusStatement = BusStatement;
class SendBaseStatement extends Statement {
}
exports.SendBaseStatement = SendBaseStatement;
class SendMsgStatement extends SendBaseStatement {
    get type() { return 'sendMsg'; }
    parser(context) { return; }
}
exports.SendMsgStatement = SendMsgStatement;
class SendEmailStatement extends SendMsgStatement {
    get method() { return 'email'; }
    ;
    db(db) { return db.sendMsgStatement(this); }
}
exports.SendEmailStatement = SendEmailStatement;
class SendSmsStatement extends SendMsgStatement {
    get method() { return 'sms'; }
    ;
    db(db) { return db.sendMsgStatement(this); }
}
exports.SendSmsStatement = SendSmsStatement;
class SendAppStatement extends SendBaseStatement {
    get type() { return 'sendApp'; }
    parser(context) { return; }
    db(db) { return db.sendAppStatement(this); }
}
exports.SendAppStatement = SendAppStatement;
class SendStatement extends Statement {
    get type() { return 'send'; }
    db(db) { return this.send.db(db); }
    parser(context) { return new parser.PSendStatement(this, context); }
}
exports.SendStatement = SendStatement;
class InlineStatement extends Statement {
    get type() { return 'inline'; }
    db(db) { return db.inlineStatement(this); }
    parser(context) { return new parser.PInlineStatement(this, context); }
}
exports.InlineStatement = InlineStatement;
class ScheduleStatement extends Statement {
    get type() { return 'schedule'; }
    db(db) { return db.schedule(this); }
    parser(context) { return new parser.PScheduleStatement(this, context); }
}
exports.ScheduleStatement = ScheduleStatement;
class ExecSqlStatement extends Statement {
    get type() { return 'execSql'; }
    db(db) { return db.execSqlStatement(this); }
    parser(context) { return new parser.PExecSqlStatement(this, context); }
}
exports.ExecSqlStatement = ExecSqlStatement;
class LogStatement extends Statement {
    get type() { return 'log'; }
    db(db) { return db.logStatement(this); }
    parser(context) { return new parser.PLogStatement(this, context); }
}
exports.LogStatement = LogStatement;
var EnumRole;
(function (EnumRole) {
    EnumRole[EnumRole["none"] = 0] = "none";
    EnumRole[EnumRole["Admin"] = 1] = "Admin";
    EnumRole[EnumRole["Owner"] = 2] = "Owner";
})(EnumRole || (exports.EnumRole = EnumRole = {}));
;
class RoleStatement extends Statement {
    get type() { return 'role'; }
    db(db) { return db.roleStatement(this); }
    parser(context) { return new parser.PRoleStatement(this, context); }
}
exports.RoleStatement = RoleStatement;
class AssertRoleStatement extends RoleStatement {
    parser(context) { return new parser.PAssertRoleStatement(this, context); }
}
exports.AssertRoleStatement = AssertRoleStatement;
class SleepStatement extends Statement {
    get type() { return 'sleep'; }
    db(db) { return db.sleepStatement(this); }
    parser(context) { return new parser.PSleepStatement(this, context); }
}
exports.SleepStatement = SleepStatement;
var EnumTransaction;
(function (EnumTransaction) {
    EnumTransaction[EnumTransaction["off"] = 0] = "off";
    EnumTransaction[EnumTransaction["start"] = 1] = "start";
    EnumTransaction[EnumTransaction["commit"] = 2] = "commit";
})(EnumTransaction || (exports.EnumTransaction = EnumTransaction = {}));
class TransactionStatement extends Statement {
    get type() { return 'transaction'; }
    db(db) { return db.transactionStatement(this); }
    parser(context) { return new parser.PTransactionStatement(this, context); }
}
exports.TransactionStatement = TransactionStatement;
class PokeStatement extends Statement {
    get type() { return 'poke'; }
    db(db) { return db.pokeStatement(this); }
    parser(context) { return new parser.PPokeStatement(this, context); }
}
exports.PokeStatement = PokeStatement;
var QueueAction;
(function (QueueAction) {
    QueueAction[QueueAction["add"] = 0] = "add";
    QueueAction[QueueAction["again"] = 1] = "again";
    QueueAction[QueueAction["done"] = 2] = "done";
    QueueAction[QueueAction["del"] = 3] = "del";
})(QueueAction || (exports.QueueAction = QueueAction = {}));
class QueueStatement extends Statement {
    get type() { return 'queue'; }
    db(db) { return db.queueStatement(this); }
    parser(context) { return new parser.PQueueStatement(this, context); }
}
exports.QueueStatement = QueueStatement;
//# sourceMappingURL=Statement.js.map