"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectWithMeSpace = exports.SelectSpace = exports.DeleteSpace = exports.WithFromSpace = exports.PSelect = exports.PDelete = exports.PWithFrom = void 0;
const element_1 = require("./element");
const space_1 = require("./space");
const tokens_1 = require("./tokens");
const il_1 = require("../il");
const expression_1 = require("./expression");
class PWithFrom extends element_1.PElement {
    constructor(select, context) {
        super(select, context);
        this.select = select;
    }
    parseFromID() {
        let where = this.select.where = new il_1.ComarePartExpression();
        let idField = new il_1.VarOperand();
        idField._var = ['id'];
        idField.parser(this.context).parse();
        where.atoms.push(idField);
        this.context.parseElement(where);
        where.atoms.push(new il_1.OpEQ());
        this.select.isFromID = true;
    }
    // return: true=end of select
    parseFromWhere() {
        this.ts.readToken();
        let fromTable = this.select.from = this.parseFromTable();
        let { name, alias, arr } = fromTable;
        if (name !== undefined && alias === undefined && arr === undefined) {
            if (this.ts.token === tokens_1.Token.LPARENTHESE) {
                this.ts.readToken();
                this.parseFromID();
                this.ts.passToken(tokens_1.Token.RPARENTHESE);
                return true;
            }
            if (this.ts.token === tokens_1.Token.EQU) {
                this.ts.readToken();
                this.parseFromID();
                return true;
            }
        }
        this.parseJoin();
        if (this.ts.isKeyword('where')) {
            this.ts.readToken();
            let where = this.select.where = new il_1.CompareExpression();
            let parser = where.parser(this.context);
            parser.parse();
        }
        return false;
    }
    parseFromTableAlias(fromTable) {
        if (this.ts.token !== tokens_1.Token.VAR || this.ts.isKeywords(...this.selectKeys)) {
            this.ts.expect('alias name');
        }
        fromTable.alias = this.ts.lowerVar;
        this.ts.readToken();
    }
    parseFromTable() {
        let fromTable = new il_1.FromTable();
        switch (this.ts.token) {
            case tokens_1.Token.VAR:
            case tokens_1.Token.DOLLARVAR:
                fromTable.name = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.DOT) {
                    this.ts.readToken();
                    if (this.ts.token !== tokens_1.Token.VAR) {
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
            case tokens_1.Token.LPARENTHESE:
                this.ts.readToken();
                if (this.ts.lowerVar !== 'select')
                    this.expect('子查询');
                this.ts.readToken();
                let select = fromTable.select = new il_1.Select();
                let parser = select.parser(this.context);
                parser.parse();
                this.ts.assertToken(tokens_1.Token.RPARENTHESE);
                this.ts.readToken();
                this.ts.assertKey('as');
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.VAR ||
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
    parseJoin() {
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR)
                return;
            if (this.ts.varBrace === true)
                return;
            let jt = new il_1.JoinTable();
            switch (this.ts.lowerVar) {
                default: return;
                case 'queue':
                    this.parseQueueJoin(jt);
                    break;
                case 'join':
                    this.parseOtherJoin(il_1.JoinType.inner, jt);
                    break;
                case 'left':
                    this.ts.readToken();
                    this.parseOtherJoin(il_1.JoinType.left, jt);
                    break;
                case 'right':
                    this.ts.readToken();
                    this.parseOtherJoin(il_1.JoinType.right, jt);
                    break;
            }
            let { joins } = this.select;
            if (joins === undefined)
                joins = this.select.joins = [];
            joins.push(jt);
        }
    }
    parseQueueJoin(jt) {
        jt.join = il_1.JoinType.queue;
        this.ts.readToken();
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            let queueIx = new il_1.ValueExpression();
            queueIx.parser(this.context).parse();
            jt.queueIx = queueIx;
        }
        this.ts.assertKey('join');
        this.ts.readToken();
        let fromTable = this.parseFromTable();
        jt.table = fromTable;
        let on;
        if (this.ts.isKeyword('on') === true) {
            this.ts.readToken();
            on = new il_1.ValueExpression();
            on.parser(this.context).parse();
        }
    }
    parseOtherJoin(joinType, jt) {
        jt.join = joinType;
        this.ts.assertKey('join');
        this.ts.readToken();
        let fromTable = this.parseFromTable();
        jt.table = fromTable;
        this.ts.assertKey('on');
        this.ts.readToken();
        jt.on = new il_1.CompareExpression();
        let parser = jt.on.parser(this.context);
        parser.parse();
    }
    setFromTables(space, theSpace) {
        let ok = true;
        let { from, joins } = this.select;
        if (this.setFromTable(from, space, theSpace) === false)
            ok = false;
        if (joins === undefined)
            return ok;
        let prevTable = from;
        let queueIndex = 1;
        for (let join of joins) {
            if (join.join === il_1.JoinType.queue) {
                let { entity: { type, jName } } = prevTable;
                if (type !== 'queue') {
                    this.log(`${jName} is not QUEUE, QUEUE JOIN invalid`);
                    ok = false;
                }
                prevTable.alias = `$q${queueIndex}`;
                join.prevTable = prevTable;
                let { queueIx } = join;
                if (queueIx !== undefined) {
                    if (queueIx.pelement.scan(space) === false)
                        ok = false;
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
            if (this.setFromTable(join.table, space, theSpace) === false)
                ok = false;
            prevTable = join.table;
        }
        for (let join of joins) {
            let { on, join: joinType } = join;
            if (joinType === il_1.JoinType.queue) {
                if (on === undefined)
                    continue;
            }
            if (join.on.pelement.scan(theSpace) === false)
                ok = false;
        }
        return ok;
    }
    setFromTable(ft, space, theSpace) {
        let ok = true;
        if (ft === undefined)
            return ok;
        let { name: ftName, arr } = ft;
        if (ftName !== undefined) {
            if (ft.entity === undefined) {
                let entity = space.getEntityTable(ftName);
                if (entity === undefined) {
                    let tv = space.getTableVar(ftName);
                    if (tv === undefined) {
                        tv = space.getReturn(ftName);
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
                        ft.entity = new il_1.EntityVarTable(tv);
                    }
                }
                else if (entity.type === 'id') {
                    ft.entity = entity;
                }
                else if (entity.type === 'arr' && entity.isBus === true) {
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
                if (ftSelect.pelement.scan(theSpace) === false)
                    ok = false;
            }
        }
        return ok;
    }
}
exports.PWithFrom = PWithFrom;
class PDelete extends PWithFrom {
    constructor() {
        super(...arguments);
        this.selectKeys = ['delete', 'from', 'where'];
    }
    _parse() {
        let tbls = [];
        while (this.ts.isKeyword('from') === false) {
            if (this.ts.token !== tokens_1.Token.VAR)
                break;
            tbls.push(this.ts.lowerVar);
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.COMMA)
                break;
            this.ts.readToken();
        }
        if (tbls.length > 0)
            this.select.tables = tbls;
        if (this.ts.isKeyword('from') === true) {
            let ret = this.parseFromWhere();
            if (ret === true) {
                this.ts.error('= can not be here');
            }
            return;
        }
    }
    hasAliasTable(t) {
        let { from, joins } = this.select;
        if (t === from.alias)
            return true;
        if (joins !== undefined) {
            for (let j of joins) {
                if (j.table.alias === t)
                    return true;
            }
        }
        return false;
    }
    setTables() {
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
    scan(space) {
        let ok = true;
        let theSpace = new DeleteSpace(space, this.select);
        if (this.setFromTables(space, theSpace) === false)
            ok = false;
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
            let expSpace = new expression_1.ExpressionSpace(theSpace);
            if (where.pelement.scan(expSpace) === false)
                ok = false;
            if (expSpace.groupType === il_1.GroupType.Group) {
                ok = false;
                this.log('where里面不能有group函数');
            }
        }
        return ok;
    }
}
exports.PDelete = PDelete;
class PSelect extends PWithFrom {
    constructor() {
        super(...arguments);
        this.selectKeys = ['select', 'from', 'where', 'group', 'having', 'order', 'union', 'limit'];
    }
    _parse() {
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
            if (ret === true)
                return;
        }
        let { unions } = this.select;
        if (!unions)
            return;
        while (this.ts.isKeyword('union') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('select') === false) {
                this.ts.expect('select');
            }
            this.ts.readToken();
            let unionSelect = new il_1.Select();
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
                if (col.alias === undefined)
                    col.value.pelement.expect('分组别名');
            }
            if (this.ts.isKeyword('having')) {
                this.ts.readToken();
                let having = this.select.having = new il_1.CompareExpression();
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
            let limit = this.select.limit = new il_1.ValueExpression();
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
    parseOrderBys() {
        if (this.ts.isKeyword('when') === true) {
            this.select.switchOrderBy = this.parseOrderBySwitch();
        }
        else if (this.ts.isKeyword('by') === true) {
            this.ts.readToken();
            this.select.orderBy = this.parseOrderBy();
        }
    }
    parseOrderBySwitch() {
        let whenThen = [];
        let whenElse;
        for (;;) {
            if (this.ts.isKeyword('when') === true) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                let when = this.ts.lowerVar;
                this.ts.readToken();
                this.ts.assertKey('by');
                this.ts.readToken();
                let thenOrderBy = this.parseOrderBy();
                whenThen.push({ when, then: thenOrderBy });
                continue;
            }
            if (this.ts.isKeyword('else') === true) {
                this.ts.readToken();
                whenElse = this.parseOrderBy();
            }
            break;
        }
        let switchOrderBy = {
            whenThen,
            whenElse,
        };
        return switchOrderBy;
    }
    parseOrderBy() {
        let orderByArr = [];
        for (;;) {
            let orderBy = new il_1.OrderBy();
            orderByArr.push(orderBy);
            let exp = orderBy.value = new il_1.ValueExpression();
            let parser = exp.parser(this.context);
            parser.parse();
            if (this.ts.token === tokens_1.Token.VAR && this.ts.varBrace === false) {
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
            if (this.ts.token !== tokens_1.Token.COMMA)
                break;
            this.ts.readToken();
        }
        return orderByArr;
    }
    parseFromTableAlias(fromTable) {
        if (this.ts.token !== tokens_1.Token.VAR || this.ts.isKeywords(...this.selectKeys)) {
            let { inForeach, isValue, toVar } = this.select;
            if (inForeach === true || toVar === true || isValue === true)
                return;
            this.ts.expect('alias name');
        }
        fromTable.alias = this.ts.lowerVar;
        this.ts.readToken();
    }
    parseColumns() {
        let { toVar, isValue } = this.select;
        let ret = [];
        for (;;) {
            let col = {};
            ret.push(col);
            if (toVar === true) {
                let { token } = this.ts;
                if (token !== tokens_1.Token.VAR && token !== tokens_1.Token.DOLLARVAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                col.alias = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.DOT) {
                    this.ts.readToken();
                    if (this.ts.token !== tokens_1.Token.VAR) {
                        this.ts.expectToken(tokens_1.Token.VAR);
                    }
                    col.alias += '.' + this.ts.lowerVar;
                    this.ts.readToken();
                }
                this.ts.assertToken(tokens_1.Token.EQU);
                this.ts.readToken();
            }
            if (this.ts.token === tokens_1.Token.SHARP || this.ts.token === tokens_1.Token.MUL) {
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
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                col.alias = this.ts.lowerVar;
                this.ts.readToken();
            }
            else {
                let value = col.value = new il_1.ValueExpression();
                let parser = value.parser(this.context);
                parser.parse();
                if (toVar === false && isValue === false) {
                    let alias;
                    if (this.ts.isKeyword('as')) {
                        this.ts.readToken();
                        //let isSelectKeys = false;
                        if (this.ts.token === tokens_1.Token.VAR) {
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
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            break;
        }
        return ret;
    }
    scanFromID(space) {
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
    scan(space) {
        let ok = true;
        let { toVar, columns, where, groupBy, limit, unions, isFromID, cte } = this.select;
        this.select.owner = space.getEntity(undefined);
        let theSpace = new SelectSpace(space, this.select);
        if (cte !== undefined) {
            if (cte.select.pelement.scan(theSpace) === false)
                ok = false;
        }
        if (isFromID === true) {
            if (this.scanFromID(space) === false)
                return false;
        }
        if (this.setFromTables(space, theSpace) === false) {
            return false;
        }
        let colGroupType;
        for (let i in columns) {
            let col = columns[i];
            let { value, alias } = col;
            let colSpace = new expression_1.ExpressionSpace(theSpace);
            let { pelement } = value;
            if (pelement) {
                if (pelement.scan(colSpace) === false)
                    ok = false;
            }
            if (toVar === true) {
                // 这个地方space不能用colSpace，也不能是theSpace，必须用space
                // 这里是查变量，不能是表中的字段                
                let p = col.pointer = space.varPointer(alias, undefined);
                if (p === undefined) {
                    ok = false;
                    this.log(alias + '没有定义');
                }
            }
            let gt = colSpace.groupType;
            if (gt === il_1.GroupType.Both || gt === undefined)
                continue;
            if (colGroupType === undefined) {
                colGroupType = gt;
                continue;
            }
            if (colGroupType !== gt) {
                ok = false;
                this.log('字段有不同的group属性');
            }
        }
        let expSpace = new expression_1.ExpressionSpace(theSpace);
        if (where !== undefined) {
            if (where.pelement.scan(expSpace) === false)
                ok = false;
            if (expSpace.groupType === il_1.GroupType.Group) {
                ok = false;
                this.log('where里面不能有group函数');
            }
        }
        if (groupBy !== undefined) {
            for (let i in groupBy) {
                let v = groupBy[i].value.pelement;
                if (v.scan(expSpace) === false)
                    ok = false;
                if (expSpace.groupType === il_1.GroupType.Group) {
                    this.log('group里面不能用group函数');
                    ok = false;
                }
            }
            let having = this.select.having;
            if (having !== undefined) {
                let havingSpace = new SelectWithMeSpace(space, this.select);
                if (having.pelement.scan(havingSpace) === false)
                    ok = false;
                if ((havingSpace.groupType & il_1.GroupType.Group) !== il_1.GroupType.Group) {
                    this.log('having里面只能是group值');
                }
            }
        }
        if (limit !== undefined) {
            limit.pelement.scan(expSpace);
        }
        if (this.scanOrderBys(theSpace) === false)
            ok = false;
        if (unions) {
            for (let uionSelect of unions) {
                uionSelect.pelement.scan(space);
            }
        }
        return ok;
    }
    scanOrderBys(space) {
        let { orderBy, switchOrderBy } = this.select;
        if (orderBy) {
            return this.scanOrderBy(space, orderBy);
        }
        if (switchOrderBy) {
            return this.scanSwitchOrderBy(space, switchOrderBy);
        }
        return true;
    }
    scanOrderBy(space, orderBy) {
        let ok = true;
        let orderSpace = new SelectWithMeSpace(space, this.select);
        let { groupBy } = this.select;
        for (let ord of orderBy) {
            let expSpace = new expression_1.ExpressionSpace(orderSpace);
            if (ord.value.pelement.scan(expSpace) === false)
                ok = false;
            if (groupBy === undefined) {
                if (expSpace.groupType === il_1.GroupType.Group) {
                    this.log('order by里面不能用group值');
                    ok = false;
                }
            }
            else {
                if (expSpace.groupType === il_1.GroupType.Single) {
                    this.log('order by里面应该用group值');
                    ok = false;
                }
            }
        }
        return ok;
    }
    scanSwitchOrderBy(space, switchOrderBy) {
        let ok = true;
        let { whenThen, whenElse } = switchOrderBy;
        for (let wt of whenThen) {
            let { when, then } = wt;
            if (space.isOrderSwitch(when) === false) {
                this.log(`order switch '${when}' is not defined`);
                ok = false;
            }
            if (this.scanOrderBy(space, then) === false)
                ok = false;
        }
        if (whenElse) {
            if (this.scanOrderBy(space, whenElse) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PSelect = PSelect;
class WithFromSpace extends space_1.Space {
    constructor(outer, select) {
        super(outer);
        this._groupType = il_1.GroupType.Both;
        this.select = select;
        let { cte } = select;
        if (cte !== undefined) {
            this.cteTable = new il_1.CTETable(cte);
        }
    }
    get groupType() { return this._groupType; }
    set groupType(value) { this._groupType = value; }
    _getEntityTable(name) {
        return;
    }
    _getTableVar(name) {
        if (this.cteTable === undefined)
            return;
        if (this.cteTable.name === name)
            return this.cteTable;
    }
    _getTableByAlias(alias) {
        let { from } = this.select;
        if (from === undefined)
            return;
        if (from.alias === alias)
            return from;
        let joins = this.select.joins;
        if (joins === undefined)
            return;
        for (let join of joins) {
            if (alias === join.table.alias)
                return join.table;
        }
    }
    _varPointer(name, isField) {
        let ft = this.select.from;
        if (ft === undefined)
            return;
        if (ft.alias === undefined) {
            let entity = ft.entity;
            if (entity !== undefined) {
                return entity.fieldPointer(name);
            }
        }
    }
}
exports.WithFromSpace = WithFromSpace;
class DeleteSpace extends WithFromSpace {
}
exports.DeleteSpace = DeleteSpace;
class SelectSpace extends WithFromSpace {
    _varPointer(name, isField) {
        let ft = this.select.from;
        if (ft === undefined)
            return;
        if (ft.alias === undefined) {
            let entity = ft.entity;
            if (entity !== undefined) {
                return entity.fieldPointer(name);
            }
        }
        let groupBy = this.select.groupBy;
        if (groupBy === undefined)
            return;
        let g = groupBy.find(v => v.alias === name);
        if (g === undefined)
            return;
        let p = new il_1.GroupByPointer();
        p.exp = g.value;
        return p;
    }
}
exports.SelectSpace = SelectSpace;
// order by and having need to use field in the select
class SelectWithMeSpace extends SelectSpace {
    _varPointer(name, isField) {
        let ret = super._varPointer(name, isField);
        if (ret !== undefined)
            return ret;
        let col = this.select.columns.find(v => v.alias === name);
        if (col === undefined)
            return;
        return new il_1.FieldPointer();
    }
}
exports.SelectWithMeSpace = SelectWithMeSpace;
//# sourceMappingURL=select.js.map