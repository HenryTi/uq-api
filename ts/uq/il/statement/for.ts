import * as parser from '../../parser';
import { Builder } from "../builder";
import { Arr, Queue } from "../entity";
import { Statement, Var, Statements } from "./Statement";
import { IElement } from '../IElement';
import { Select } from '../select';
import { BForList } from '../../builder';
import { ValueExpression } from '../Exp';
import { BizInOutArr } from '../Biz';

export class ForEach extends Statement {
    isInProc: boolean;          // for temporary table, not drop in proc, maybe called multiple times in one session
    list: ForList;
    statements: Statements;

    get type(): string { return 'foreach'; }
    db(db: Builder): object {
        return this.list.db(db, this);
    }
    parser(context: parser.PContext) { return new parser.PForEach(this, context); }
    eachChild(callback: (el: IElement, name: string) => void) {
        this.statements.eachChild((child, cname) => callback(child, cname));
    }
    getVar(name: string): Var { return this.list.getVar(name); }
    createBizForDetail(bizDetail: string, vars: Var[]): ForList { return undefined; }
}

export abstract class ForList {
    getVar(name: string): Var {
        return undefined;
    }
    abstract db(db: Builder, forEach: ForEach): BForList;
    check(): string { return undefined; }
}

export class ForArr extends ForList {
    readonly arr: Arr;
    constructor(arr: Arr) {
        super();
        this.arr = arr;
    }
    db(db: Builder, forEach: ForEach): BForList {
        return db.foreachArr(forEach, this);
    }
}

export class ForBizInOutArr extends ForList {
    readonly arr: BizInOutArr;
    constructor(arr: BizInOutArr) {
        super();
        this.arr = arr;
    }
    db(db: Builder, forEach: ForEach): BForList {
        return db.foreachBizInOutArr(forEach, this);
    }
}

export abstract class ForListWithVars extends ForList {
    readonly vars: Var[];
    constructor(vars: Var[]) {
        super();
        this.vars = vars;
    }
    getVar(name: string): Var {
        if (this.vars === undefined) return;
        return this.vars.find(v => v.name === name);
    }
}

export class ForSelect extends ForListWithVars {
    readonly select: Select;
    constructor(vars: Var[], select: Select) {
        super(vars);
        this.select = select;
    }
    db(db: Builder, forEach: ForEach): BForList {
        return db.foreachSelect(forEach, this);
    }
}

export class ForQueue extends ForListWithVars {
    readonly queue: Queue;
    readonly ix: ValueExpression;
    constructor(vars: Var[], queue: Queue, ix: ValueExpression) {
        super(vars);
        this.queue = queue;
        this.ix = ix;
    }
    db(db: Builder, forEach: ForEach): BForList {
        return db.foreachQueue(forEach, this);
    }
}
