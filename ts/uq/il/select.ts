import * as parser from '../parser';
import { CompareExpression, ValueExpression } from './Exp';
import { IElement } from './IElement';
import { Field, Table } from './field';
import { Pointer, NamePointer, FieldPointer } from './pointer';
import { Entity, Queue } from './entity';
import { LocalTableBase } from './statement';

export enum JoinType { left, right, queue, join, inner, cross };
export type OrderType = 'asc' | 'desc';

export class FromTable implements Table {
    alias: string;
    name: string;
    arr: string;
    entity: Entity; // & Table;
    select: Select;

    getTableAlias(): string { return this.alias; }
    getTableName(): string { return; }
    fieldPointer(name: string): Pointer {
        if (this.entity !== undefined) {
            if (this.entity === null) return;
            let tbl = this.entity;
            return (tbl as Entity & Table).fieldPointer(name);
        }
        if (this.select !== undefined) return this.select.field(name);
        return;
    }
    getKeys(): Field[] { return; }
    getFields(): Field[] { return; }
    getArrTable(): Table { return; }
}

export class JoinTable {
    join: JoinType;
    table: FromTable;
    on: CompareExpression | ValueExpression;
    queueIx: ValueExpression;
    prevTable: FromTable;
}

export class OrderBy {
    value: ValueExpression;
    asc: OrderType;
}

export abstract class WithFrom extends IElement {
    from: FromTable;
    joins: JoinTable[];
    where: CompareExpression;
    isFromID: boolean;
    cte: CTE;
}

export class Delete extends WithFrom {
    tables: string[];
    get type(): string { return 'delete'; }
    parser(context: parser.PContext) {
        return new parser.PDelete(this, context);
    }
}

export interface Column {
    alias: string;
    value: ValueExpression;
    pointer?: NamePointer;
}

export interface OrderByWhenThen {
    when: string;					// 变量值
    then: OrderBy[];
}
export interface SwitchOrderBy {
    whenThen: OrderByWhenThen[];		// 分支
    whenElse: OrderBy[];
}

export interface CTE {
    recursive: boolean;
    select: Select;
    alias: string;
}

export class Select extends WithFrom {
    readonly type = 'select';
    owner: Entity;
    distinct: boolean = false;
    inForeach: boolean = false;
    isValue: boolean = false;
    toVar: boolean = false;         // is select to variable
    // 所有的select都加 for update，防止deadlock。query里面，没有transaction，所以不起作用
    lock: boolean = true; // false; 
    intoTable: LocalTableBase;
    intoEntityTable: Entity & Table;
    intoQueue: Queue;
    columns: Column[];
    orderBy: OrderBy[];
    switchOrderBy: SwitchOrderBy;
    groupBy: { alias: string; value: ValueExpression }[];
    having: CompareExpression;
    limit: ValueExpression;
    ignore: boolean = false;
    unions: Select[] = [];

    parser(context: parser.PContext) {
        return new parser.PSelect(this, context);
    }

    // 这个field，是作为子表的字段，从外部引用。
    // 所以，没有 group 属性了。
    field(name: string): Pointer {
        let by = this.groupBy;
        if (by !== undefined) {
            let gb = by.find(v => v.alias === name);
            //if (gb !== undefined) return new GroupByPointer();
            if (gb !== undefined) return new FieldPointer();
        }
        let col = this.columns.find(v => v.alias === name);
        if (col !== undefined) return new FieldPointer();
        return;
    }
}
