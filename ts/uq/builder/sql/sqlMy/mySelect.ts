import { OrderType, Return as IlReturn, VarPointer } from '../../../il';
import { ExpVal } from '../exp';
import { Select, LockType, Order } from '../select';
import { SqlBuilder } from '../sqlBuilder';
import { Column } from '../statementWithFrom';
import { MySelectBuilder } from './mySelectBuilder';
import { MyColumn, MyOrder } from './myWithFromBuilder';

export class MySelect extends Select {
    protected createWithFromBuilder() { return new MySelectBuilder }
    protected createColumn(exp: ExpVal, alias?: string, pointer?: VarPointer): Column { return new MyColumn(exp, alias, pointer) }
    createOrder(exp: ExpVal, asc: OrderType): Order { return new MyOrder(exp, asc) }
    to(sb: SqlBuilder, tab: number) {
        this.buildSelect(sb, tab);
        this.buildSelectEnd(sb, tab);
    }

    buildSelect(sb: SqlBuilder, tab: number) {
        sb.pushFieldValue0(false);
        if (this._switchOrder) {
            this.buildSqlWithSwithOrder(sb, tab);
        }
        else {
            this.buildSql(sb, tab, undefined);
        }
        sb.popFieldValue0();
    }

    private buildSqlWithSwithOrder(sb: SqlBuilder, tab: number) {
        sb.tab(tab).append('DROP TEMPORARY TABLE IF EXISTS `_$page_order`').ln();
        sb.tab(tab).append('CREATE TEMPORARY TABLE `_$page_order` (`order` INT NOT NULL AUTO_INCREMENT,`id` BIGINT NULL,PRIMARY KEY(`order`)) ENGINE=MyISAM').ln();

        sb.tab(tab).append('IF ').var('$pageStart').append(' IS NULL THEN SET ')
            .var('$pageStart').append('=0; END IF').ln();
        let { whenThen, whenElse } = this._switchOrder;

        let first = true;
        for (let wt of whenThen) {
            let { when, then } = wt;
            sb.tab(tab);
            if (first === true) first = false;
            else {
                sb.append('ELSE');
            }
            sb.append('IF ').var('$orderSwitch').append('=\'').append(when).append('\' THEN').n();
            this.buildInsertPageOrder(sb, tab + 1, when, then);
        }
        if (whenElse) {
            sb.tab(tab).append('ELSE').n();
            this.buildInsertPageOrder(sb, tab + 1, '$else', whenElse);
        }
        sb.tab(tab).append('END IF').ln();
        //--tab;
        //sb.tab(tab).append(`END IF`).ln();

        sb.tab(tab);
        this.buildInto(sb, tab, true);
        this.buildSelectStart(sb, tab);
        sb.append('$tblOrder.`order` as `$order`, ');
        this.buildColumns(sb, tab);
        this.buildFrom(sb, tab);
        sb.append(' JOIN _$page_order as $tblOrder ON $tblOrder.id=');
        sb.exp(this._columns[0].exp);
        //this.buildWhere(sb, tab);
        sb.n().tab(tab + 1).append('WHERE 1=1');
        sb.append(' AND $tblOrder.`order`>').var('$pageStart'); //.append(' AND $tblOrder.`type`=@pageType');
        this.buildGroup(sb, tab);
        this.buildHaving(sb, tab);
        lnAuto(sb, tab);
        sb.append('ORDER BY $tblOrder.`order` asc');
        lnAuto(sb, tab);
        sb.append('LIMIT ').var('$pageSize');
    }

    private buildInsertPageOrder(sb: SqlBuilder, tab: number, orderSwitch: string, orderBy: Order[]) {
        //sb.tab(tab).append('INSERT INTO _$page_order (`type`, `order`, `id`) ');
        sb.tab(tab).append('INSERT INTO _$page_order (`id`) ');
        this.buildSelectStart(sb, tab);
        //sb.append('@pageType as `type`, @pageOrder:=@pageOrder+1 as `order`, ');
        //sb.exp(this._columns[0].exp);
        //sb.append(' as `id` FROM (SELECT ');
        sb.exp(this._columns[0].exp);
        sb.append(' as id');
        this.buildFrom(sb, tab);
        this.buildWhere(sb, tab);
        this.buildGroup(sb, tab);
        this.buildHaving(sb, tab);
        this.buildOrderBy(sb, tab, orderBy);
        lnAuto(sb, tab);
        sb.append('LIMIT 1000');
        this.buildSelectEnd(sb, tab);
    }

    private buildSql(sb: SqlBuilder, tab: number, orderBy: Order[]) {
        if (tab > 0) sb.tab(tab);
        this.buildInto(sb, tab, undefined);
        this.buildSqlSelect(sb, tab);
    }

    private buildInto(sb: SqlBuilder, tab: number, withOrderColumn: boolean) {
        if (this.into === undefined) return;
        let insertInto = this.ignore === true ? 'INSERT IGNORE INTO ' : 'INSERT INTO ';
        if (typeof this.into === 'string') {
            sb.append(insertInto).entityTable(this.into);
            lnAuto(sb, tab);
        }
        else {
            let into = this.into as IlReturn;
            let { name, needTable, fields } = into;
            if (needTable === true) {
                sb.append(insertInto).var(name);
                if (fields !== undefined) {
                    sb.space().sepStart().l();
                    /* 这里的into table fields, 可能跟后面的select字段不一致。所以，必须用select columns
                    在编译时刻，已经把select的column的alias设成字段名了。
                    xxx 留着这个代码，产生了很多的错误 for (let f of fields) {
                        sb.sep().fld(f.name);
                    }
                    */
                    if (withOrderColumn === true) {
                        sb.append('$order, ');
                    }
                    for (let col of this._columns) {
                        let { alias } = col;
                        if (alias === undefined) throw 'insert into table field undefined';
                        sb.sep().fld(alias);
                    }
                    sb.sepEnd().r();
                }
                lnAuto(sb, tab);
            }
        }
    }

    private buildSelectParts(sb: SqlBuilder, tab: number) {
        this.buildCTE(sb, tab);
        this.buildSelectStart(sb, tab);
        this.buildColumns(sb, tab);
        this.buildFrom(sb, tab);
        this.buildWhere(sb, tab);
        this.buildGroup(sb, tab);
        this.buildHaving(sb, tab);
        this.buildOrderBy(sb, tab, undefined);
        this.buildLimit(sb, tab);
        this.buildLock(sb, tab);
    }

    private buildCTE(sb: SqlBuilder, tab: number) {
        if (this.cte === undefined) return;
        let { alias, recursive, select } = this.cte;
        sb.tab(tab).append('WITH ');
        if (recursive === true) sb.append('RECURSIVE ');
        sb.name(alias);
        sb.append(' AS ').l();
        lnAuto(sb, tab + 2);
        (select as MySelect).buildSqlSelect(sb, tab);
        sb.r();
        lnAuto(sb, tab + 1);
    }

    private buildSqlSelect(sb: SqlBuilder, tab: number) {
        if (this.unions !== undefined) {
            sb.l();
            this.buildSelectParts(sb, tab);
            sb.r();
            lnAuto(sb, tab + 2);
            for (let union of this.unions) {
                sb.append('UNION ');
                if (this.unionsAll === true) sb.append('ALL ');
                lnAuto(sb, tab + 2);
                sb.l();
                union.buildSelect(sb, tab + 1);
                sb.r();
                lnAuto(sb, tab + 2);
            }
        }
        else {
            this.buildSelectParts(sb, tab);
        }
    }

    private buildSelectStart(sb: SqlBuilder, tab: number) {
        sb.append('SELECT ');
        if (this.distinct === true) sb.append('DISTINCT ');
    }

    private buildColumnName(sb: SqlBuilder, col: Column) {
        let { alias, pointer } = col;
        let v: string;
        if (pointer !== undefined) {
            v = pointer.varName(alias);
        }
        else
            v = alias;
        sb.var(v);
    }

    private buildColumns(sb: SqlBuilder, tab: number) {
        if (this.toVar === false) {
            sb.sepStart();
            for (let col of this._columns) {
                sb.sep();
                col.to(sb); //, this.toVar);
            }
            sb.sepEnd();
        }
        else {
            sb.sepStart();
            for (let col of this._columns) {
                sb.sep().exp(col.exp);
            }
            sb.sepEnd();
            sb.append(' INTO ');
            sb.sepStart();
            for (let col of this._columns) {
                sb.sep();
                this.buildColumnName(sb, col);
            }
            sb.sepEnd();
        }
    }

    private buildFrom(sb: SqlBuilder, tab: number) {
        this.withFromBuilder.buildFrom(sb, tab);
    }

    private buildWhere(sb: SqlBuilder, tab: number) {
        this.withFromBuilder.buildWhereTo(sb, tab);
    }

    private buildGroup(sb: SqlBuilder, tab: number) {
        if (this._group !== undefined) {
            lnAuto(sb, tab);
            sb.append('GROUP BY ').sepStart();
            for (let g of this._group) sb.sep().exp(g);
            sb.sepEnd();
        }
    }

    private buildHaving(sb: SqlBuilder, tab: number) {
        if (this._having !== undefined) {
            lnAuto(sb, tab);
            sb.append('HAVING ').exp(this._having);
        }
    }

    private buildOrderBy(sb: SqlBuilder, tab: number, orderBy: Order[]) {
        orderBy = orderBy ?? this._order;
        if (orderBy !== undefined) {
            lnAuto(sb, tab);
            sb.append('ORDER BY ').sepStart();
            for (let order of orderBy) {
                sb.sep();
                order.to(sb);
            }
            sb.sepEnd();
        }
    }

    private buildLimit(sb: SqlBuilder, tab: number) {
        if (this._limit === undefined) return;
        lnAuto(sb, tab);
        sb.append('LIMIT ').exp(this._limit);
    }

    private buildLock(sb: SqlBuilder, tab: number) {
        if (this.lock !== undefined) {
            switch (this.lock) {
                case LockType.update: sb.append(' FOR UPDATE');
            }
        }
    }

    private buildSelectEnd(sb: SqlBuilder, tab: number) {
        if (tab > 0) sb.ln();
    }
}

function lnAuto(sb: SqlBuilder, tab: number) {
    if (tab > 0) sb.nTab(1);
    else sb.nAuto();
}
