import { PElement } from './element';
import { Space } from './space';
import { Token } from './tokens';
import {
    Select, Table, GroupType, OrderBy
    , ValueExpression, CompareExpression, FromTable, JoinTable, Entity
    , Pointer, FieldPointer, GroupByPointer, VarPointer, WithFrom, Delete
    , EntityVarTable, Arr, Column, TableVar, SwitchOrderBy, OrderByWhenThen
    , LocalTableBase, JoinType, ComarePartExpression, VarOperand, OpEQ
    , CTE, Field, bigIntField, CTETable
} from '../il';
import { ExpressionSpace } from './expression';
import { PContext } from './pContext';

export abstract class PWithFrom<S extends WithFrom> extends PElement {
    protected select: S;
    protected selectKeys: string[];
    constructor(select: S, context: PContext) {
        super(select, context);
        this.select = select;
    }

    private parseFromID() {
        let where = this.select.where = new ComarePartExpression();
        let idField = new VarOperand();
        idField._var = ['id'];
        idField.parser(this.context).parse();
        where.atoms.push(idField);
        this.context.parseElement(where);
        where.atoms.push(new OpEQ());
        this.select.isFromID = true;
    }

    // return: true=end of select
    protected parseFromWhere(): boolean {
        this.ts.readToken();
        let fromTable = this.select.from = this.parseFromTable();
        let { name, alias, arr } = fromTable;
        if (name !== undefined && alias === undefined && arr === undefined) {
            if (this.ts.token === Token.LPARENTHESE) {
                this.ts.readToken();
                this.parseFromID();
                this.ts.passToken(Token.RPARENTHESE);
                return true;
            }
            if (this.ts.token === Token.EQU) {
                this.ts.readToken();
                this.parseFromID();
                return true;
            }
        }

        this.parseJoin();

        if (this.ts.isKeyword('where')) {
            this.ts.readToken();
            let where = this.select.where = new CompareExpression();
            let parser = where.parser(this.context);
            parser.parse();
        }
        return false;
    }

    protected parseFromTableAlias(fromTable: FromTable) {
        if (this.ts.token !== Token.VAR || this.ts.isKeywords(...this.selectKeys)) {
            this.ts.expect('alias name');
        }
        fromTable.alias = this.ts.lowerVar;
        this.ts.readToken();
    }
    private parseFromTable(): FromTable {
        let fromTable = new FromTable();
        switch (this.ts.token) {
            case Token.VAR:
            case Token.DOLLARVAR:
                fromTable.name = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token as any === Token.DOT) {
                    this.ts.readToken();
                    if (this.ts.token !== Token.VAR) {
                        this.ts.expect('TUID 的 Arr 名字');
                    }
                    fromTable.arr = this.ts.lowerVar;
                    this.ts.readToken();
                }
                if (this.ts.isKeyword('as') === true) {
                    this.ts.readToken();
                    this.parseFromTableAlias(fromTable);
                }
                break;
            case Token.LPARENTHESE:
                this.ts.readToken();
                if (this.ts.lowerVar !== 'select') this.expect('子查询');
                this.ts.readToken();
                let select = fromTable.select = new Select();
                let parser = select.parser(this.context);
                parser.parse();
                this.ts.assertToken(Token.RPARENTHESE);
                this.ts.readToken();
                this.ts.assertKey('as');
                this.ts.readToken();
                if (this.ts.token !== Token.VAR as any ||
                    this.ts.lowerVar === 'where' && this.ts.varBrace === false) {
                    this.expect('表别名');
                }
                fromTable.alias = this.ts.lowerVar;
                this.ts.readToken();
                break;
            default:
                this.ts.expect('表', '子查询');
        }
        return fromTable;
    }

    private parseJoin() {
        for (; ;) {
            if (this.ts.token !== Token.VAR) return;
            if (this.ts.varBrace === true) return;
            let jt = new JoinTable();
            switch (this.ts.lowerVar) {
                default: return;
                case 'queue':
                    this.parseQueueJoin(jt);
                    break;
                case 'join':
                    this.parseOtherJoin(JoinType.inner, jt);
                    break;
                case 'left':
                    this.ts.readToken();
                    this.parseOtherJoin(JoinType.left, jt);
                    break;
                case 'right':
                    this.ts.readToken();
                    this.parseOtherJoin(JoinType.right, jt);
                    break;
            }
            let { joins } = this.select;
            if (joins === undefined) joins = this.select.joins = [];
            joins.push(jt);
        }
    }

    private parseQueueJoin(jt: JoinTable) {
        jt.join = JoinType.queue;
        this.ts.readToken();
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            let queueIx = new ValueExpression();
            queueIx.parser(this.context).parse();
            jt.queueIx = queueIx;
        }
        this.ts.assertKey('join');
        this.ts.readToken();
        let fromTable = this.parseFromTable();
        jt.table = fromTable;
        let on: CompareExpression | ValueExpression;
        if (this.ts.isKeyword('on') === true) {
            this.ts.readToken();
            on = new ValueExpression();
            on.parser(this.context).parse();
        }
    }

    private parseOtherJoin(joinType: JoinType, jt: JoinTable) {
        jt.join = joinType;
        this.ts.assertKey('join');
        this.ts.readToken();
        let fromTable = this.parseFromTable();
        jt.table = fromTable;
        this.ts.assertKey('on');
        this.ts.readToken();
        jt.on = new CompareExpression();
        let parser = jt.on.parser(this.context);
        parser.parse();
    }

    protected setFromTables(space: Space, theSpace: Space): boolean {
        let ok = true;
        let { from, joins } = this.select;
        if (this.setFromTable(from, space, theSpace) === false) ok = false;
        if (joins === undefined) return ok;
        let prevTable = from;
        let queueIndex = 1;
        for (let join of joins) {
            if (join.join === JoinType.queue) {
                let { entity: { type, jName } } = prevTable;
                if (type !== 'queue') {
                    this.log(`${jName} is not QUEUE, QUEUE JOIN invalid`);
                    ok = false;
                }
                prevTable.alias = `$q${queueIndex}`;
                join.prevTable = prevTable;
                let { queueIx } = join;
                if (queueIx !== undefined) {
                    if (queueIx.pelement.scan(space) === false) ok = false;
                }
                ++queueIndex;
                let prevEntity = space.getEntity(prevTable.name);
                if (prevEntity === undefined) {
                    this.log(`unknown entity ${prevTable.name}`);
                    ok = false;
                }
                else if (prevEntity.type !== 'queue') {
                    this.log(`${prevTable.name} is not Queue`);
                    ok = false;
                }
            }
            if (this.setFromTable(join.table, space, theSpace) === false) ok = false;
            prevTable = join.table;
        }
        for (let join of joins) {
            let { on, join: joinType } = join;
            if (joinType === JoinType.queue) {
                if (on === undefined) continue;
            }
            if (join.on.pelement.scan(theSpace) === false) ok = false;
        }
        return ok;
    }

    private setFromTable(ft: FromTable, space: Space, theSpace: Space): boolean {
        let ok = true;
        if (ft === undefined) return ok;
        let { name: ftName, arr } = ft;
        if (ftName !== undefined) {
            if (ft.entity === undefined) {
                let entity = space.getEntityTable(ftName);
                if (entity === undefined) {
                    let tv: LocalTableBase = space.getTableVar(ftName);
                    if (tv === undefined) {
                        tv = space.getReturn(ftName) as LocalTableBase;
                    }
                    if (tv === undefined) {
                        let queue = space.getEntity(ftName);
                        if (queue?.type === 'queue') {
                            ft.entity = queue;
                        }
                        else {
                            ft.entity = null;
                            ok = false;
                            this.log(ftName + '表不存在');
                        }
                    }
                    else {
                        ft.entity = new EntityVarTable(tv);
                    }
                }
                else if (entity.type === 'id') {
                    ft.entity = entity;
                }
                else if (entity.type === 'arr' && (entity as Arr).isBus === true) {
                    ft.entity = null;
                    ok = false;
                    this.log(`arr ${ftName} 不能用于select or set from`);
                }
                else {
                    ft.entity = arr !== undefined ? entity.getArr(arr) : entity;
                }
            }
        }
        else {
            let ftSelect = ft.select;
            if (ftSelect !== undefined) {
                if (ftSelect.pelement.scan(theSpace) === false) ok = false;
            }
        }
        return ok;
    }
}

export class PDelete extends PWithFrom<Delete> {
    protected selectKeys = ['delete', 'from', 'where'];
    protected _parse() {
        let tbls: string[] = [];
        while (this.ts.isKeyword('from') === false) {
            if (this.ts.token !== Token.VAR) break;
            tbls.push(this.ts.lowerVar);
            this.ts.readToken();
            if (this.ts.token as any !== Token.COMMA) break;
            this.ts.readToken();
        }
        if (tbls.length > 0) this.select.tables = tbls;
        if (this.ts.isKeyword('from') === true) {
            let ret = this.parseFromWhere();
            if (ret === true) {
                this.ts.error('= can not be here');
            }
            return;
        }
    }

    private hasAliasTable(t: string) {
        let { from, joins } = this.select;
        if (t === from.alias) return true;
        if (joins !== undefined) {
            for (let j of joins) {
                if (j.table.alias === t) return true;
            }
        }
        return false;
    }

    private setTables(): boolean {
        let ok = true;
        let tables = this.select.tables = [];
        let { from, joins } = this.select;
        if (from.alias !== undefined) {
            tables.push(from.alias);
        }
        else {
            ok = false;
        }
        if (joins !== undefined) {
            for (let j of joins) {
                let { alias } = j.table;
                if (alias !== undefined) {
                    tables.push(alias);
                }
                else {
                    ok = false;
                }
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        let theSpace = new DeleteSpace(space, this.select);
        if (this.setFromTables(space, theSpace) === false) ok = false;
        let { tables } = this.select;
        if (tables !== undefined) {
            for (let t of tables) {
                if (this.hasAliasTable(t) === false) {
                    ok = false;
                    this.log('delete ' + t + ' not found in from or joins');
                }
            }
        }
        else {
            if (this.setTables() === false) {
                ok = false;
                this.log('table alias must list after DELETE when table has alias');
            }
        }
        let where = this.select.where;
        if (where !== undefined) {
            let expSpace = new ExpressionSpace(theSpace);
            if (where.pelement.scan(expSpace) === false) ok = false;
            if (expSpace.groupType === GroupType.Group) {
                ok = false;
                this.log('where里面不能有group函数');
            }
        }
        return ok;
    }
}

export class PSelect extends PWithFrom<Select> {
    protected selectKeys = ['select', 'from', 'where', 'group', 'having', 'order', 'union', 'limit'];
    protected _parse() {
        if (this.ts.isKeyword('distinct') === true) {
            this.select.distinct = true;
            this.ts.readToken();
        }
        if (this.select.columns === undefined) {
            let columns = this.select.columns = this.parseColumns();
            if (this.select.isValue === true && columns.length > 1) {
                this.error('子查询不能超过一个column');
            }
        }

        if (this.ts.isKeyword('from') === true) {
            let ret = this.parseFromWhere();
            if (ret === true) return;
        }
        let { unions } = this.select;
        if (!unions) return;
        while (this.ts.isKeyword('union') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('select') === false) {
                this.ts.expect('select');
            }
            this.ts.readToken();
            let unionSelect = new Select();
            unionSelect.unions = undefined;
            unionSelect.parser(this.context).parse();
            unions.push(unionSelect);
        }

        if (this.ts.isKeyword('group') === true) {
            this.ts.readToken();
            this.ts.assertKey('by');
            this.ts.readToken();
            let cols = this.select.groupBy = this.parseColumns();
            for (let col of cols) {
                if (col.alias === undefined) col.value.pelement.expect('分组别名');
            }

            if (this.ts.isKeyword('having')) {
                this.ts.readToken();
                let having = this.select.having = new CompareExpression();
                let parser = having.parser(this.context);
                parser.parse();
            }
        }

        if (this.ts.isKeyword('order') === true) {
            this.ts.readToken();
            this.parseOrderBys();
        }

        if (this.ts.isKeyword('limit') === true) {
            this.ts.readToken();
            let limit = this.select.limit = new ValueExpression();
            let parser = limit.parser(this.context);
            parser.parse();
        }

        if (this.ts.isKeyword('lock') === true) {
            this.ts.readToken();
            this.select.lock = true;
        }
        if (this.ts.isKeyword('no') === true) {
            this.ts.readToken();
            this.ts.passKey('lock');
            this.select.lock = false;
        }
    }

    private parseOrderBys() {
        if (this.ts.isKeyword('when') === true) {
            this.select.switchOrderBy = this.parseOrderBySwitch();
        }
        else if (this.ts.isKeyword('by') === true) {
            this.ts.readToken();
            this.select.orderBy = this.parseOrderBy();
        }
    }

    private parseOrderBySwitch(): SwitchOrderBy {
        let whenThen: OrderByWhenThen[] = [];
        let whenElse: OrderBy[];
        for (; ;) {
            if (this.ts.isKeyword('when') === true) {
                this.ts.readToken();
                if (this.ts.token !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                }
                let when = this.ts.lowerVar;
                this.ts.readToken();
                this.ts.assertKey('by');
                this.ts.readToken();
                let thenOrderBy = this.parseOrderBy();
                whenThen.push({ when, then: thenOrderBy })
                continue;
            }
            if (this.ts.isKeyword('else') === true) {
                this.ts.readToken();
                whenElse = this.parseOrderBy();
            }
            break;
        }

        let switchOrderBy: SwitchOrderBy = {
            whenThen,
            whenElse,
        };
        return switchOrderBy;
    }

    private parseOrderBy(): OrderBy[] {
        let orderByArr = [];
        for (; ;) {
            let orderBy = new OrderBy();
            orderByArr.push(orderBy);
            let exp = orderBy.value = new ValueExpression();
            let parser = exp.parser(this.context);
            parser.parse();
            if (this.ts.token === Token.VAR && this.ts.varBrace === false) {
                if (this.ts.lowerVar === 'asc') {
                    orderBy.asc = 'asc';
                    this.ts.readToken();
                }
                else if (this.ts.lowerVar === 'desc') {
                    orderBy.asc = 'desc';
                    this.ts.readToken();
                }
            }
            else {
                orderBy.asc = 'asc';
            }
            if (this.ts.token !== Token.COMMA) break;
            this.ts.readToken();
        }
        return orderByArr;
    }

    protected parseFromTableAlias(fromTable: FromTable) {
        if (this.ts.token !== Token.VAR || this.ts.isKeywords(...this.selectKeys)) {
            let { inForeach, isValue, toVar } = this.select;
            if (inForeach === true || toVar === true || isValue === true) return;
            this.ts.expect('alias name');
        }
        fromTable.alias = this.ts.lowerVar;
        this.ts.readToken();
    }

    private parseColumns(): Column[] {
        let { toVar, isValue } = this.select;
        let ret: Column[] = [];
        for (; ;) {
            let col: Column = {} as any;
            ret.push(col);
            if (toVar === true) {
                let { token } = this.ts;
                if (token !== Token.VAR && token !== Token.DOLLARVAR) {
                    this.ts.expectToken(Token.VAR);
                }
                col.alias = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token === Token.DOT) {
                    this.ts.readToken();
                    if (this.ts.token as any !== Token.VAR) {
                        this.ts.expectToken(Token.VAR);
                    }
                    col.alias += '.' + this.ts.lowerVar;
                    this.ts.readToken();
                }
                this.ts.assertToken(Token.EQU);
                this.ts.readToken();
            }
            if (this.ts.token === Token.SHARP || this.ts.token === Token.MUL) {
                if (toVar === true) {
                    this.ts.error('# is not allowed in to value SELECT');
                }
                if (isValue === true) {
                    this.ts.error('# is not allowed in sub SELECT');
                }
                this.ts.readToken();
                if (this.ts.isKeyword('of') === true) {
                    this.ts.readToken();
                }
                if (this.ts.token as any !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                }
                col.alias = this.ts.lowerVar;
                this.ts.readToken();
            }
            else {
                let value = col.value = new ValueExpression();
                let parser = value.parser(this.context);
                parser.parse();
                if (toVar === false && isValue === false) {
                    let alias: string;
                    if (this.ts.isKeyword('as')) {
                        this.ts.readToken();
                        //let isSelectKeys = false;
                        if (this.ts.token === Token.VAR) {
                            if (this.ts.isKeywords(...this.selectKeys))
                                this.ts.expect('column alias');
                            alias = this.ts.lowerVar;
                            this.ts.readToken();
                        }
                    }
                    else {
                        alias = value.alias();
                    }
                    if (alias !== undefined)
                        col.alias = alias;
                    else if (this.select.isValue === false) {
                        this.expect('别名');
                    }
                }
            }

            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            break;
        }
        return ret;
    }

    private scanFromID(space: Space): boolean {
        let ok = true;
        let { from } = this.select;
        let { name } = from;
        let entity = space.getEntity(name);
        if (entity === undefined) {
            this.log(`'${name}' is not defined`);
            ok = false;
        }
        else {
            switch (entity.type) {
                case 'id':
                case 'idx':
                    break;
                default:
                    this.log(`'${name}' must be ID or IDX`);
                    ok = false;
                    break;
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        let { toVar, columns, where, groupBy, limit, unions, isFromID, cte } = this.select;

        this.select.owner = space.getEntity(undefined);
        let theSpace = new SelectSpace(space, this.select);
        if (cte !== undefined) {
            if (cte.select.pelement.scan(theSpace) === false) ok = false;
        }

        if (isFromID === true) {
            if (this.scanFromID(space) === false) return false;
        }
        if (this.setFromTables(space, theSpace) === false) {
            return false;
        }
        let colGroupType: GroupType;
        for (let i in columns) {
            let col = columns[i];
            let { value, alias } = col;
            let colSpace = new ExpressionSpace(theSpace);
            let { pelement } = value;
            if (pelement) {
                if (pelement.scan(colSpace) === false) ok = false;
            }
            if (toVar === true) {
                // 这个地方space不能用colSpace，也不能是theSpace，必须用space
                // 这里是查变量，不能是表中的字段                
                let p = col.pointer = space.varPointer(alias, undefined) as VarPointer;
                if (p === undefined) {
                    ok = false;
                    this.log(alias + '没有定义');
                }
            }
            let gt = colSpace.groupType;
            if (gt === GroupType.Both || gt === undefined) continue;
            if (colGroupType === undefined) {
                colGroupType = gt;
                continue;
            }
            if (colGroupType !== gt) {
                ok = false;
                this.log('字段有不同的group属性');
            }
        }

        let expSpace = new ExpressionSpace(theSpace);
        if (where !== undefined) {
            if (where.pelement.scan(expSpace) === false) ok = false;
            if (expSpace.groupType === GroupType.Group) {
                ok = false;
                this.log('where里面不能有group函数');
            }
        }
        if (groupBy !== undefined) {
            for (let i in groupBy) {
                let v = groupBy[i].value.pelement;
                if (v.scan(expSpace) === false) ok = false;
                if (expSpace.groupType === GroupType.Group) {
                    this.log('group里面不能用group函数');
                    ok = false;
                }
            }
            let having = this.select.having;
            if (having !== undefined) {
                let havingSpace = new SelectWithMeSpace(space, this.select);
                if (having.pelement.scan(havingSpace) === false) ok = false;
                if ((havingSpace.groupType & GroupType.Group) !== GroupType.Group) {
                    this.log('having里面只能是group值');
                }
            }
        }
        if (limit !== undefined) {
            limit.pelement.scan(expSpace);
        }
        if (this.scanOrderBys(theSpace) === false) ok = false;

        if (unions) {
            for (let uionSelect of unions) {
                uionSelect.pelement.scan(space);
            }
        }
        return ok;
    }

    private scanOrderBys(space: SelectSpace): boolean {
        let { orderBy, switchOrderBy } = this.select;
        if (orderBy) {
            return this.scanOrderBy(space, orderBy as OrderBy[]);
        }
        if (switchOrderBy) {
            return this.scanSwitchOrderBy(space, switchOrderBy);
        }
        return true;
    }

    private scanOrderBy(space: SelectSpace, orderBy: OrderBy[]): boolean {
        let ok = true;
        let orderSpace = new SelectWithMeSpace(space, this.select);
        let { groupBy } = this.select;
        for (let ord of orderBy) {
            let expSpace = new ExpressionSpace(orderSpace);
            if (ord.value.pelement.scan(expSpace) === false) ok = false;
            if (groupBy === undefined) {
                if (expSpace.groupType === GroupType.Group) {
                    this.log('order by里面不能用group值');
                    ok = false;
                }
            }
            else {
                if (expSpace.groupType === GroupType.Single) {
                    this.log('order by里面应该用group值');
                    ok = false;
                }
            }
        }
        return ok;
    }

    private scanSwitchOrderBy(space: SelectSpace, switchOrderBy: SwitchOrderBy): boolean {
        let ok = true;
        let { whenThen, whenElse } = switchOrderBy;
        for (let wt of whenThen) {
            let { when, then } = wt;
            if (space.isOrderSwitch(when) === false) {
                this.log(`order switch '${when}' is not defined`);
                ok = false;
            }
            if (this.scanOrderBy(space, then) === false) ok = false;
        }
        if (whenElse) {
            if (this.scanOrderBy(space, whenElse) === false) ok = false;
        }
        return ok;
    }
}

export abstract class WithFromSpace<S extends WithFrom> extends Space {
    private _groupType: GroupType = GroupType.Both;
    select: S;
    cteTable: CTETable;
    constructor(outer: Space, select: S) {
        super(outer);
        this.select = select;
        let { cte } = select;
        if (cte !== undefined) {
            this.cteTable = new CTETable(cte);
        }
    }
    get groupType(): GroupType { return this._groupType; }
    set groupType(value: GroupType) { this._groupType = value; }
    protected _getEntityTable(name: string): Entity & Table {
        return;
    }
    protected _getTableVar(name: string): TableVar {
        if (this.cteTable === undefined) return;
        if (this.cteTable.name === name) return this.cteTable;
    }
    protected _getTableByAlias(alias: string): Table {
        let { from } = this.select;
        if (from === undefined) return;
        if (from.alias === alias) return from;
        let joins = this.select.joins;
        if (joins === undefined) return;
        for (let join of joins) {
            if (alias === join.table.alias) return join.table;
        }
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        let ft = this.select.from;
        if (ft === undefined) return;
        if (ft.alias === undefined) {
            let entity = ft.entity;
            if (entity !== undefined) {
                return (entity as Entity & Table).fieldPointer(name);
            }
        }
    }
}

export class DeleteSpace extends WithFromSpace<Delete> {
}

export class SelectSpace extends WithFromSpace<Select> {
    protected _varPointer(name: string, isField: boolean): Pointer {
        let ft = this.select.from;
        if (ft === undefined) return;
        if (ft.alias === undefined) {
            let entity = ft.entity;
            if (entity !== undefined) {
                return (entity as Entity & Table).fieldPointer(name);
            }
        }
        let groupBy = this.select.groupBy;
        if (groupBy === undefined) return;
        let g = groupBy.find(v => v.alias === name);
        if (g === undefined) return;
        let p = new GroupByPointer();
        p.exp = g.value;
        return p;
    }
}

// order by and having need to use field in the select
export class SelectWithMeSpace extends SelectSpace {
    protected _varPointer(name: string, isField: boolean): Pointer {
        let ret = super._varPointer(name, isField);
        if (ret !== undefined) return ret;
        let col = this.select.columns.find(v => v.alias === name);
        if (col === undefined) return;
        return new FieldPointer();
    }
}
