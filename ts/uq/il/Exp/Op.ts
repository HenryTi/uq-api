import {
    PElement,
    PVarOperand, POpGroupFunc, POpGroupCountFunc,
    PContext, PMatchOperand, POpTypeof, POpID, POpDollarVar, POpNO,
    POpEntityId, POpEntityName, POpRole, POpQueue, POpCast,
    POpUMinute, POpSearch, POpNameof,
    POpAt, POpUqDefinedFunction
} from '../../parser';
import { DataType } from '../datatype';
import { IElement } from '../IElement';
import { Select } from '../select';
import { Pointer } from '../pointer';
import { Entity, ID, Queue } from '../entity';
import { BizBase, BizOptions, OptionsItem } from '../Biz';
import { Stack } from './Stack';
import { ValueExpression } from './Expression';

export abstract class Atom extends IElement {
    get type(): string { return 'atom'; }
    get scalarValue(): string | number | [string, string] { return undefined; }
    parser(context: PContext): PElement { return; }
    abstract to(stack: Stack): void;
}

export class OpOr extends Atom {
    to(stack: Stack) { stack.or(); }
}
export class OpAnd extends Atom {
    to(stack: Stack) { stack.and(); }
}
export class OpNot extends Atom {
    to(stack: Stack) { stack.not(); }
}
export class OpLE extends Atom {
    to(stack: Stack) { stack.le(); }
}
export class OpLT extends Atom {
    to(stack: Stack) { stack.lt(); }
}
export class OpEQ extends Atom {
    to(stack: Stack) { stack.eq(); }
}
export class OpNE extends Atom {
    to(stack: Stack) { stack.ne(); }
}
export class OpGT extends Atom {
    to(stack: Stack) { stack.gt(); }
}
export class OpGE extends Atom {
    to(stack: Stack) { stack.ge(); }
}
export class OpAdd extends Atom {
    to(stack: Stack) { stack.add(); }
}
export class OpSub extends Atom {
    to(stack: Stack) { stack.sub(); }
}
export class OpMul extends Atom {
    to(stack: Stack) { stack.mul(); }
}
export class OpDiv extends Atom {
    to(stack: Stack) { stack.div(); }
}
export class OpDecDiv extends Atom {
    to(stack: Stack) { stack.decDiv(); }
}
export class OpMod extends Atom {
    to(stack: Stack) { stack.mod(); }
}
export class OpBitwiseAnd extends Atom {
    to(stack: Stack) { stack.bitAnd(); }
}
export class OpBitwiseOr extends Atom {
    to(stack: Stack) { stack.bitOr(); }
}
export class OpBitwiseInvert extends Atom {
    to(stack: Stack) { stack.bitInvert(); }
}
export class OpBitLeft extends Atom {
    to(stack: Stack) { stack.bitLeft(); }
}
export class OpBitRight extends Atom {
    to(stack: Stack) { stack.bitRight(); }
}
export class OpNeg extends Atom {
    to(stack: Stack) { stack.neg(); }
}
export class OpParenthese extends Atom {
    to(stack: Stack) { stack.parenthese() }
}
export class OpJsonProp extends Atom {
    to(stack: Stack) { stack.jsonProp(); }
}
export class OpAt extends Atom {
    bizName: string[];
    biz: BizBase;
    bizVal: ValueExpression;
    to(stack: Stack) { stack.at(this.biz, this.bizName, this.bizVal); }
    parser(context: PContext): PElement {
        return this.pelement = new POpAt(this, context);
    }
}
export class TextOperand extends Atom {
    get type(): string { return 'string'; }
    get scalarValue(): string | number { return this.text; }
    text: string;
    constructor(text: string) {
        super();
        this.text = text;
    }
    to(stack: Stack) { stack.str(this.text); }
}
export class NumberOperand extends Atom {
    get type(): string { return 'number'; }
    get scalarValue(): string | number { return this.num; }
    num: number;
    constructor(num: number) {
        super();
        this.num = num;
    }
    to(stack: Stack) { stack.num(this.num); }
}
export class HexOperand extends Atom {
    get type(): string { return 'hex'; }
    get scalarValue(): string | number { return Number.parseInt(this.text, 16); }
    text: string;
    constructor(text: string) {
        super();
        this.text = text;
    }
    to(stack: Stack) { stack.hex(this.text); }
}
export class NullOperand extends Atom {
    get scalarValue(): string | number { return null; }
    to(stack: Stack) { stack.hex('null'); }
}
export class OpSearchCase extends Atom {
    whenCount: number;
    hasElse: boolean;
    constructor(whenCount: number, hasElse: boolean) {
        super();
        this.whenCount = whenCount;
        this.hasElse = hasElse;
    }
    to(stack: Stack) { stack.searchCase(this.whenCount, this.hasElse); }
}
export class OpSimpleCase extends Atom {
    whenCount: number;
    hasElse: boolean;
    constructor(whenCount: number, hasElse: boolean) {
        super();
        this.whenCount = whenCount;
        this.hasElse = hasElse;
    }
    to(stack: Stack) { stack.simpleCase(this.whenCount, this.hasElse); }
}
export class OpCast extends Atom {
    dataType: DataType;
    parser(context: PContext) { return this.pelement = new POpCast(this, context); }
    to(stack: Stack) {
        stack.cast(this.dataType);
    }
}
export class OpFunction extends Atom {
    func: string;
    paramCount: number;
    readonly isUqFunc: boolean;
    constructor(func: string, paramCount: number, isUqFunc: boolean = false) {
        super();
        this.func = func;
        this.paramCount = paramCount;
        this.isUqFunc = isUqFunc;
    }
    to(stack: Stack) { stack.func(this.func, this.paramCount, this.isUqFunc) }
}
export class OpGroupFunc extends Atom {
    func: string;
    value: ValueExpression;
    constructor(func: string) {
        super();
        this.func = func;
    }
    parser(context: PContext) { return new POpGroupFunc(this, context); }
    to(stack: Stack) { stack.groupFunc(this.func, this.value) }
}
export class OpGroupCountFunc extends OpGroupFunc {
    parser(context: PContext) { return new POpGroupCountFunc(this, context); }
}
export class OpUqDefinedFunction extends Atom {
    func: string;
    paramCount: number;
    constructor(func: string, paramCount: number) {
        super();
        this.func = func;
        this.paramCount = paramCount;
    }
    parser(context: PContext) { return new POpUqDefinedFunction(this, context); }
    to(stack: Stack) { stack.funcUqDefined(this.func, this.paramCount) }
}
export class StarOperand extends Atom {
    to(stack: Stack) { stack.star(); }
}
export class OpConverter extends Atom {
    dataType: DataType;
    paramCount: number;
    constructor(dataType: DataType, paramCount: number) {
        super();
        this.dataType = dataType;
        this.paramCount = paramCount;
    }
    to(stack: Stack) { }
}
export class DatePartOperand extends Atom {
    datePart: string;
    constructor(datePart: string) {
        super();
        this.datePart = datePart;
    }
    to(stack: Stack) { stack.datePart(this.datePart) }
}
export class ExistsSubOperand extends Atom {
    to(stack: Stack) { stack.exists(); }
}
export class OpIsNull extends Atom {
    to(stack: Stack) { stack.isNull() }
}
export class OpIsNotNull extends Atom {
    to(stack: Stack) { stack.isNotNull() }
}
export class OpIn extends Atom {
    private params: number;
    constructor(params: number) {
        super();
        this.params = params;
    }
    to(stack: Stack) { stack.in(this.params) }
}
export class SubSelectOperand extends Atom {
    get type(): string { return 'select'; }
    protected select: Select;
    constructor() {
        super();
        this.select = new Select();
        this.select.isValue = true;
    }
    parser(context: PContext) { return this.pelement = this.select.parser(context); }
    to(stack: Stack) { stack.select(this.select) }
}
export class OpLike extends Atom {
    to(stack: Stack) { stack.like() }
}
export class OpBetween extends Atom {
    to(stack: Stack) { }
}
export class OpNotBetween extends Atom {
    to(stack: Stack) { }
}
const dollarVars = [
    'unit', 'user', 'site', 'insite', 'stamp', 'importing'
    , 'pagestart', 'pagesize'
    , 'date', 'id', 'state', 'row', 'sheet_date', 'sheet_no', 'sheet_discription'
];
export class OpDollarVar extends Atom {
    static isValid(name: string): boolean { return dollarVars.find(v => v === name) !== undefined }
    _var: string;
    constructor(_var: string) { super(); this._var = _var; }
    to(stack: Stack) { stack.dollarVar(this._var) }
    parser(context: PContext) { return new POpDollarVar(this, context); }
}
export class VarOperand extends Atom {
    get type(): string { return 'var'; }
    dotFirst: boolean = false;
    _var: string[] = [];
    enumValue: number | string;
    /*
    options: BizOptions;
    optionsItem: OptionsItem;
    */
    pointer: Pointer;
    parser(context: PContext) { return new PVarOperand(this, context); }
    to(stack: Stack) {
        /*
        if (this.options !== undefined) {
            stack.dotVar(['%' + this.options.name, this.optionsItem.name]);
            return;
        }
        */
        if (this.enumValue === undefined) {
            this.pointer.to(stack, this);
            return;
        }
        if (typeof this.enumValue === 'number') {
            stack.num(this.enumValue);
        }
        else {
            stack.str(this.enumValue);
        }
    }
    isSameVar(v: VarOperand): boolean {
        if (this._var.length !== 1) return false;
        if (v._var.length !== 1) return false;
        return this._var[0] === v._var[0];
    }
}
export class OpMatch extends Atom {
    varOperands: VarOperand[];
    against: ValueExpression;
    isBoolean: boolean;
    get type(): string { return 'match'; }
    parser(context: PContext) { return new PMatchOperand(this, context); }
    to(stack: Stack) {
        stack.match(this.varOperands, this.against, this.isBoolean);
    }
}
export class OpTypeof extends Atom {
    val: ValueExpression;
    entity: Entity;
    get type(): string { return 'typeof'; }
    parser(context: PContext) { return new POpTypeof(this, context); }
    to(stack: Stack) {
        stack.typeof(this.entity, this.val);
    }
}
export class OpNameof extends Atom {
    entity: Entity;
    get type(): string { return 'nameof'; }
    parser(context: PContext) { return new POpNameof(this, context); }
    to(stack: Stack) {
        stack.nameof(this.entity);
    }
}
export class OpRole extends Atom {
    unit: ValueExpression;
    role: string;
    roleSub: string;
    get type(): string { return 'role'; }
    parser(context: PContext) { return new POpRole(this, context); }
    to(stack: Stack) {
        stack.role(this.role, this.unit);
    }
}
export enum IDNewType {
    get = 0, new = 1, newIfNull = 2, create = 3, prev = 99
}
export class OpID extends Atom {
    id: ID;
    forID: ID;
    newType: IDNewType = IDNewType.get;
    vals: ValueExpression[] = [];
    uuid: ValueExpression;
    stamp: ValueExpression;
    phrases: string[] | ValueExpression;
    get type(): string { return 'ID'; }
    parser(context: PContext) { return new POpID(this, context); }
    to(stack: Stack) {
        stack.ID(this.id, this.forID, this.newType, this.vals, this.uuid, this.stamp, this.phrases);
    }
}
export class OpUMinute extends Atom {
    stamp: ValueExpression;
    get type(): string { return 'uminute'; }
    parser(context: PContext) { return new POpUMinute(this, context); }
    to(stack: Stack) {
        stack.UMinute(this.stamp);
    }
}
export class OpNO extends Atom {
    id: ID;
    stamp: ValueExpression;
    get type(): string { return 'NO'; }
    parser(context: PContext) { return new POpNO(this, context); }
    to(stack: Stack) {
        stack.NO(this.id, this.stamp);
    }
}
export class OpEntityId extends Atom {
    val: ValueExpression;
    get type(): string { return 'EntityId'; }
    parser(context: PContext) { return new POpEntityId(this, context); }
    to(stack: Stack) {
        stack.EntityId(this.val);
    }
}

export class OpEntityName extends Atom {
    val: ValueExpression;
    get type(): string { return 'EntityName'; }
    parser(context: PContext) { return new POpEntityName(this, context); }
    to(stack: Stack) {
        stack.EntityName(this.val);
    }
}

export enum OpQueueAction {
    has, wait, done
}
export class OpQueue extends Atom {
    queue: Queue;
    ix: ValueExpression;
    action: OpQueueAction;
    vals: ValueExpression[];
    get type(): string { return 'queue'; }
    parser(context: PContext) { return new POpQueue(this, context); }
    to(stack: Stack) {
        stack.Queue(this.queue, this.ix, this.action, this.vals);
    }
}

export class OpSearch extends Atom {
    key: ValueExpression;
    values: ValueExpression[];
    get type(): string { return 'search' }
    parser(context: PContext) { return new POpSearch(this, context); }
    to(stack: Stack) {
        stack.Search(this.key, this.values);
    }
}
