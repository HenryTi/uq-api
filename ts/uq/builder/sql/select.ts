import { SqlBuilder } from './sqlBuilder';
import { ExpVal, ExpCmp, convertExp, ExpField, ExpEQ, ExpAnd, ExpNum } from './exp';
import { DbContext } from '../dbContext';
import {
    Field, VarPointer, OrderType
    , Delete as IlDelete
    , FromTable, LocalTableBase, OrderBy, Expression, JoinType
    , Select as IlSelect,
    ValueExpression,
    BizSelect,
    BizEntity,
    BizPhraseType,
    BizExp
} from '../../il';
import { WithFrom, Column, Table, EntityTable, VarTable, IDEntityTable } from './statementWithFrom';
import { DeleteStatement } from './deleteStatement';

function convertExpInSelect(context: DbContext, exp: Expression) {
    return convertExp(context, exp);
}

export function convertSelect(context: DbContext, sel: IlSelect): Select {
    let { owner, toVar, columns, from, joins, where
        , intoEntityTable, intoQueue
        , intoTable, orderBy, switchOrderBy, groupBy, having
        , limit, lock, ignore, unions
        , cte } = sel;
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
        let expCol = convertExpInSelect(context, value) as ExpVal;
        sqlSelect.column(expCol, alias, pointer);
    }
    if (from !== undefined) {
        sqlSelect.from(convertTable(context, from));
        if (joins !== undefined) {
            for (let join of joins) {
                let { join: joinType } = join;
                let cmp: ExpCmp;
                if (joinType === JoinType.queue) {
                    let { on, queueIx } = join;
                    let expQueueIx = queueIx === undefined ? ExpNum.num0 : context.convertExp(queueIx) as ExpVal;
                    let expRight: ExpVal;
                    let { table, prevTable } = join;
                    let { entity, alias } = table;
                    if (on === undefined) {
                        switch (entity.type) {
                            case 'id':
                            case 'idx':
                                expRight = new ExpField('id', alias);
                                break;
                            case 'ix':
                                expRight = new ExpField('ix', alias);
                                break;
                        }
                    }
                    else {
                        expRight = context.convertExp(on) as ExpVal;
                    }
                    let { alias: prevAlias } = prevTable;
                    let expLeft = new ExpField('value', prevAlias);
                    cmp = new ExpAnd(
                        new ExpEQ(new ExpField('ix', prevAlias), expQueueIx),
                        new ExpEQ(expLeft, expRight)
                    );
                }
                else {
                    cmp = convertExpInSelect(context, join.on) as ExpCmp;
                }
                sqlSelect.join(joinType, convertTable(context, join.table)).on(cmp);
            }
        }
    }
    if (where !== undefined) sqlSelect.where(convertExpInSelect(context, where) as ExpCmp);
    if (groupBy !== undefined) {
        for (let g of groupBy) sqlSelect.group(convertExpInSelect(context, g.value) as ExpVal);
    }
    if (having !== undefined) sqlSelect.having(convertExpInSelect(context, having) as ExpCmp);
    function convertOrder(obs: OrderBy[]): Order[] {
        if (obs === undefined) return;
        return obs.map(v => {
            let { value, asc } = v;
            let ordExp = convertExpInSelect(context, value) as ExpVal;
            return sqlSelect.createOrder(ordExp, asc);
        });
    }
    sqlSelect.addOrder(convertOrder(orderBy));
    if (switchOrderBy !== undefined) {
        let { whenThen, whenElse } = switchOrderBy;
        let sqlWhenThen: { when: string, then: Order[] }[] = whenThen.map(v => {
            let { when, then } = v;
            return { when, then: convertOrder(then) };
        })
        let sqlWhenElse: Order[] = convertOrder(whenElse);
        sqlSelect.switchOrder(sqlWhenThen, sqlWhenElse);
    }
    if (limit !== undefined) {
        sqlSelect.limit(convertExpInSelect(context, limit) as ExpVal);
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
        }
    }
    return sqlSelect;
}

export function convertDelete(context: DbContext, del: IlDelete): DeleteStatement {
    let { from, joins, where } = del;
    let sqlDelete = context.factory.createDelete();
    sqlDelete.tables = del.tables;
    if (from !== undefined) {
        sqlDelete.from(convertTable(context, from));
        if (joins !== undefined) {
            for (let join of joins) {
                sqlDelete.join(join.join, convertTable(context, join.table))
                    .on(convertExpInSelect(context, join.on) as ExpCmp);
            }
        }
    }
    if (where !== undefined) sqlDelete.where(convertExpInSelect(context, where) as ExpCmp);
    return sqlDelete;
}
function convertTable(context: DbContext, tbl: FromTable): Table {
    let { entity, select, name, alias, arr } = tbl;
    if (entity !== undefined) {
        let { isVarTable, type } = entity;
        if (isVarTable === true)
            return new VarTable(name, alias);
        let hasUnit = entity.global === false && context.hasUnit;
        switch (type) {
            case 'id': return new IDEntityTable(name, hasUnit, alias);
            case 'queue': return new EntityTable('$queue', hasUnit, alias);
        }
        if (arr === undefined)
            return new EntityTable(name, hasUnit, alias);
        else
            return new EntityTable(name + '_' + arr, false, alias);
    }
    if (select !== undefined)
        return new SelectTable(convertSelect(context, select), alias);
    return new VarTable(name, alias);
}

export enum LockType { none, update };
interface CTE {
    alias: string;
    recursive: boolean;
    select: Select;
}
export abstract class Select extends WithFrom {
    distinct: boolean;
    into: LocalTableBase | string;  // insert into variable table
    ignore: boolean;
    toVar: boolean = false;
    lock: LockType = LockType.update;
    unions: Select[];
    cte: CTE;
    private _fields: string[] = [];
    protected _columns: Column[] = [];
    protected _group: ExpVal[];
    protected _having: ExpCmp;
    protected _order: Order[];
    protected _switchOrder: {
        whenThen: {
            when: string;
            then: Order[];
        }[];
        whenElse: Order[];
    };
    protected _limit: ExpVal;
    // protected _lock: boolean = true;

    protected abstract createColumn(exp: ExpVal, alias?: string, pointer?: VarPointer): Column;
    abstract createOrder(exp: ExpVal, asc: OrderType): Order;

    declare(vars: { [name: string]: Field }) { }
    abstract to(sb: SqlBuilder, tab: number): void;
    abstract buildSelect(sb: SqlBuilder, tab: number): void;
    column(exp: ExpVal, alias?: string, pointer?: VarPointer) {
        this._columns.push(this.createColumn(exp, alias, pointer));
        return this;
    }
    col(name: string, alias?: string, tbl?: string) {
        if (this._fields.findIndex(v => v === name) >= 0) return this;
        this._fields.push(name);
        this._columns.push(this.createColumn(new ExpField(name, tbl), alias));
        return this;
    }
    limit(val: ExpVal) {
        this._limit = val;
        return this;
    }
    group(exp: ExpVal) {
        if (this._group === undefined) this._group = [];
        this._group.push(exp);
    }
    having(exp: ExpCmp) {
        this._having = exp;
    }
    order(exp: ExpVal, asc: OrderType) {
        if (this._order === undefined) this._order = [];
        this._order.push(this.createOrder(exp, asc));
    }
    addOrder(order: Order[]) {
        if (order === undefined) return;
        if (this._order === undefined) this._order = [];
        this._order.push(...order);
    }
    switchOrder(whenThen: { when: string, then: Order[] }[], whenElse: Order[]) {
        this._switchOrder = {
            whenThen,
            whenElse
        };
    }
}
export abstract class Order {
    protected exp: ExpVal;
    protected asc: OrderType;
    constructor(exp: ExpVal, asc: OrderType) {
        this.exp = exp; this.asc = asc;
    }
    abstract to(sb: SqlBuilder): void;
}
export class SelectTable extends Table {
    protected select: Select;
    constructor(select: Select, alias?: string) {
        super(alias);
        this.select = select;
    }
    to(sb: SqlBuilder) {
        sb.l();
        this.select.to(sb, 0);
        sb.r();
        super.to(sb);
    }
}

export class BBizExp {
    db: string;
    bizExp: BizExp;
    param: ExpVal;
    to(sb: SqlBuilder): void {
        sb.l();
        sb.append('SELECT ');
        const { bizPhraseType } = this.bizExp.bizEntity;
        switch (bizPhraseType) {
            default: debugger; throw new Error(`not implemented bizPhraseType ${this.bizExp.bizEntity}`);
            case BizPhraseType.atom: this.atom(sb); break;
            case BizPhraseType.spec: this.spec(sb); break;
            case BizPhraseType.bin: this.bin(sb); break;
            case BizPhraseType.title: this.title(sb); break;
        }
        sb.r();
    }
    convertFrom(context: DbContext, bizExp: BizExp) {
        this.bizExp = bizExp;
        this.param = context.expVal(bizExp.param);
    }

    private atom(sb: SqlBuilder) {
        const { bizEntity, prop } = this.bizExp;
        let bud = bizEntity.props.get(prop);
        sb.append(' FROM atom WHERE id=');
        sb.exp(this.param);
        sb.append(' AND base=');
        sb.append(bizEntity.id);
    }

    private spec(sb: SqlBuilder) {

    }

    private bin(sb: SqlBuilder) {
        const { bizEntity, prop } = this.bizExp;
        sb.append('a.');
        sb.append(prop ?? 'id');
        sb.append(' FROM bin as a JOIN bud as b ON b.id=a.id AND b.ext=');
        sb.append(bizEntity.id);
        sb.append(' WHERE a.id=');
        sb.exp(this.param);
    }

    private title(sb: SqlBuilder) {

    }
}

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
