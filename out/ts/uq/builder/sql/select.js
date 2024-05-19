"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectTable = exports.Order = exports.Select = exports.LockType = exports.convertDelete = exports.convertSelect = void 0;
const exp_1 = require("./exp");
const il_1 = require("../../il");
const statementWithFrom_1 = require("./statementWithFrom");
function convertExpInSelect(context, exp) {
    return (0, exp_1.convertExp)(context, exp);
}
function convertSelect(context, sel) {
    let { owner, toVar, columns, from, joins, where, intoEntityTable, intoQueue, intoTable, orderBy, switchOrderBy, groupBy, having, limit, lock, ignore, unions, cte } = sel;
    let sqlSelect = context.factory.createSelect();
    sqlSelect.unions = unions?.map(v => convertSelect(context, v));
    sqlSelect.owner = owner;
    sqlSelect.distinct = sel.distinct;
    if (intoTable !== undefined) {
        sqlSelect.into = intoTable;
    }
    else if (intoEntityTable !== undefined) {
        sqlSelect.into = intoEntityTable.getTableName();
    }
    else if (intoQueue !== undefined) {
        sqlSelect.into = intoQueue.name;
    }
    sqlSelect.ignore = ignore;
    sqlSelect.toVar = toVar;
    for (let col of columns) {
        let { value, alias, pointer } = col;
        let expCol = convertExpInSelect(context, value);
        sqlSelect.column(expCol, alias, pointer);
    }
    if (from !== undefined) {
        sqlSelect.from(convertTable(context, from));
        if (joins !== undefined) {
            for (let join of joins) {
                let { join: joinType } = join;
                let cmp;
                if (joinType === il_1.JoinType.queue) {
                    let { on, queueIx } = join;
                    let expQueueIx = queueIx === undefined ? exp_1.ExpNum.num0 : context.convertExp(queueIx);
                    let expRight;
                    let { table, prevTable } = join;
                    let { entity, alias } = table;
                    if (on === undefined) {
                        switch (entity.type) {
                            case 'id':
                            case 'idx':
                                expRight = new exp_1.ExpField('id', alias);
                                break;
                            case 'ix':
                                expRight = new exp_1.ExpField('ix', alias);
                                break;
                        }
                    }
                    else {
                        expRight = context.convertExp(on);
                    }
                    let { alias: prevAlias } = prevTable;
                    let expLeft = new exp_1.ExpField('value', prevAlias);
                    cmp = new exp_1.ExpAnd(new exp_1.ExpEQ(new exp_1.ExpField('ix', prevAlias), expQueueIx), new exp_1.ExpEQ(expLeft, expRight));
                }
                else {
                    cmp = convertExpInSelect(context, join.on);
                }
                sqlSelect.join(joinType, convertTable(context, join.table)).on(cmp);
            }
        }
    }
    if (where !== undefined)
        sqlSelect.where(convertExpInSelect(context, where));
    if (groupBy !== undefined) {
        for (let g of groupBy)
            sqlSelect.group(convertExpInSelect(context, g.value));
    }
    if (having !== undefined)
        sqlSelect.having(convertExpInSelect(context, having));
    function convertOrder(obs) {
        if (obs === undefined)
            return;
        return obs.map(v => {
            let { value, asc } = v;
            let ordExp = convertExpInSelect(context, value);
            return sqlSelect.createOrder(ordExp, asc);
        });
    }
    sqlSelect.addOrder(convertOrder(orderBy));
    if (switchOrderBy !== undefined) {
        let { whenThen, whenElse } = switchOrderBy;
        let sqlWhenThen = whenThen.map(v => {
            let { when, then } = v;
            return { when, then: convertOrder(then) };
        });
        let sqlWhenElse = convertOrder(whenElse);
        sqlSelect.switchOrder(sqlWhenThen, sqlWhenElse);
    }
    if (limit !== undefined) {
        sqlSelect.limit(convertExpInSelect(context, limit));
    }
    if (lock === true) {
        sqlSelect.lock = LockType.update;
    }
    else {
        sqlSelect.lock = LockType.none;
    }
    if (cte !== undefined) {
        let { alias, recursive, select } = cte;
        sqlSelect.cte = {
            alias,
            recursive,
            select: convertSelect(context, select),
        };
    }
    return sqlSelect;
}
exports.convertSelect = convertSelect;
function convertDelete(context, del) {
    let { from, joins, where } = del;
    let sqlDelete = context.factory.createDelete();
    sqlDelete.tables = del.tables;
    if (from !== undefined) {
        sqlDelete.from(convertTable(context, from));
        if (joins !== undefined) {
            for (let join of joins) {
                sqlDelete.join(join.join, convertTable(context, join.table))
                    .on(convertExpInSelect(context, join.on));
            }
        }
    }
    if (where !== undefined)
        sqlDelete.where(convertExpInSelect(context, where));
    return sqlDelete;
}
exports.convertDelete = convertDelete;
function convertTable(context, tbl) {
    let { entity, select, name, alias, arr } = tbl;
    if (entity !== undefined) {
        let { isVarTable, type } = entity;
        if (isVarTable === true)
            return new statementWithFrom_1.VarTable(name, alias);
        let hasUnit = entity.global === false && context.hasUnit;
        switch (type) {
            case 'id': return new statementWithFrom_1.IDEntityTable(name, hasUnit, alias);
            case 'queue': return new statementWithFrom_1.EntityTable('$queue', hasUnit, alias);
        }
        if (arr === undefined)
            return new statementWithFrom_1.EntityTable(name, hasUnit, alias);
        else
            return new statementWithFrom_1.EntityTable(name + '_' + arr, false, alias);
    }
    if (select !== undefined)
        return new SelectTable(convertSelect(context, select), alias);
    return new statementWithFrom_1.VarTable(name, alias);
}
var LockType;
(function (LockType) {
    LockType[LockType["none"] = 0] = "none";
    LockType[LockType["update"] = 1] = "update";
})(LockType || (exports.LockType = LockType = {}));
;
class Select extends statementWithFrom_1.WithFrom {
    constructor() {
        super(...arguments);
        this.toVar = false;
        this.lock = LockType.update;
        this._fields = [];
        this._columns = [];
    }
    declare(vars, puts) { }
    column(exp, alias, pointer) {
        this._columns.push(this.createColumn(exp, alias, pointer));
        return this;
    }
    col(name, alias, tbl) {
        if (this._fields.findIndex(v => v === name) >= 0)
            return this;
        this._fields.push(name);
        this._columns.push(this.createColumn(new exp_1.ExpField(name, tbl), alias));
        return this;
    }
    limit(val) {
        this._limit = val;
        return this;
    }
    group(exp) {
        if (this._group === undefined)
            this._group = [];
        this._group.push(exp);
    }
    having(exp) {
        this._having = exp;
    }
    order(exp, asc) {
        if (this._order === undefined)
            this._order = [];
        this._order.push(this.createOrder(exp, asc));
    }
    addOrder(order) {
        if (order === undefined)
            return;
        if (this._order === undefined)
            this._order = [];
        this._order.push(...order);
    }
    switchOrder(whenThen, whenElse) {
        this._switchOrder = {
            whenThen,
            whenElse
        };
    }
}
exports.Select = Select;
class Order {
    constructor(exp, asc) {
        this.exp = exp;
        this.asc = asc;
    }
}
exports.Order = Order;
class SelectTable extends statementWithFrom_1.Table {
    constructor(select, alias) {
        super(alias);
        this.select = select;
    }
    to(sb) {
        sb.l();
        this.select.to(sb, 0);
        sb.r();
        super.to(sb);
    }
}
exports.SelectTable = SelectTable;
/*
export abstract class BBizSelect {
    db: string;
    bizSelect: BizSelect;
    on: ExpVal;
    column: { alias: string; val: ExpVal; }
    abstract to(sb: SqlBuilder): void;

    protected from(sb: SqlBuilder) {
        let { from: { main, joins } } = this.bizSelect;
        sb.append(' FROM ');
        sb.fld(this.db).dot();
        let { alias, entityArr } = main;
        sb.fld(this.tableFromBiz(entityArr[0]));
        if (alias !== undefined) {
            sb.append(' AS ').fld(alias);
        }
    }

    protected where(sb: SqlBuilder) {
        sb.append(' WHERE ')
            .append(' id=')
            .exp(this.on)
            ;
    }

    private tableFromBiz(bizEntity: BizEntity) {
        switch (bizEntity.bizPhraseType) {
            default: debugger;
            case BizPhraseType.atom: return 'atom';
            case BizPhraseType.spec: return 'spec';
            case BizPhraseType.sheet: return 'sheet';
            case BizPhraseType.bin: return 'bin';
        }
    }
}

export class BBizSelectOperand extends BBizSelect {
    override to(sb: SqlBuilder) {
        sb.append('SELECT ');
        if (this.column === undefined) {
            let { main: { entityArr, alias } } = this.bizSelect.from;
            if (alias !== undefined) {
                sb.append(alias).dot();
            }
            sb.fld('id');
        }
        else {
            let { alias, val } = this.column;
            sb.exp(val);
            if (alias !== undefined) {
                sb.append(' AS ').append(alias);
            }
        }
        this.from(sb);
        this.where(sb);
    }

    convertFrom(context: DbContext, sel: BizSelect) {
        this.db = context.dbName;
        this.bizSelect = sel;
        const { on, column } = sel;
        this.on = context.expVal(on);
        if (column !== undefined) {
            const { alias, val } = column;
            this.column = {
                alias,
                val: context.expVal(val),
            }
        }
    }
}

export class BBizSelectStatement extends BBizSelect {
    on: ExpVal;
    override to(sb: SqlBuilder) {
        sb.append('select 1=');
        sb.exp(this.on);
    }

    convertFrom(context: DbContext, sel: BizSelect) {
        const { on } = sel;
        this.on = context.expVal(on);
    }
}
*/ 
//# sourceMappingURL=select.js.map