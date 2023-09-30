import { DbContext } from '../../dbContext';
import { convertSelect } from '../select';
import { Select, TuidArr, Entity, ID, Queue, DataType, Stack as IlStack, ValueExpression, OpQueueAction, VarOperand, Expression, IDNewType, BizBase, OpJsonProp } from '../../../il';
import { ExpQueue } from './ExpQueue';
import { ExpRole } from './ExpRole';
import { ExpID } from './ExpID';
import { ExpNO } from './ExpNO';
import { Exp } from './Exp';
import { ExpAdd, ExpAnd, ExpAt, ExpBitAnd, ExpBitInvert, ExpBitLeft, ExpBitOr, ExpBitRight, ExpCast, ExpCmp, ExpDatePart, ExpDecDiv, ExpDiv, ExpDollarVar, ExpEntityId, ExpEntityName, ExpEQ, ExpExists, ExpField, ExpFunc, ExpFuncInUq, ExpGE, ExpGT, ExpHex, ExpIn, ExpIsNotNull, ExpIsNull, ExpJsonProp, ExpLE, ExpLike, ExpLT, ExpMatch, ExpMod, ExpMul, ExpNameof, ExpNE, ExpNeg, ExpNot, ExpNum, ExpOf, ExpOr, ExpParenthese, ExpSearchCase, ExpSelect, ExpSimpleCase, ExpStar, ExpStr, ExpSub, ExpTypeof, ExpVal, ExpVar } from './exps';
import { ExpUMinute } from './ExpUMinute';
import { ExpSearch } from './ExpSearch';

export function convertExp(context: DbContext, exp: Expression): Exp {
    if (!exp) return;
    let stack = new Stack(context);
    for (let atom of exp.atoms) {
        atom.to(stack);
    }
    return stack.exp;
}

class Stack implements IlStack {
    private context: DbContext;
    private arr: Exp[] = [];
    constructor(context: DbContext) {
        this.context = context;
    }
    get exp(): Exp { return this.arr.pop(); }

    private op2Cmp(cmp: (c1: ExpVal, c2: ExpVal) => ExpCmp) {
        let e2 = this.arr.pop(), e1 = this.arr.pop();
        this.arr.push(cmp(e1 as ExpVal, e2 as ExpVal));
    }
    private op1Cmp(cmp: (c1: ExpVal) => ExpCmp) {
        let e1 = this.arr.pop();
        this.arr.push(cmp(e1 as ExpVal));
    }
    private op2Cond(cmp: (c1: ExpCmp, c2: ExpCmp) => ExpCmp) {
        let e2 = this.arr.pop(), e1 = this.arr.pop();
        this.arr.push(cmp(e1 as ExpCmp, e2 as ExpCmp));
    }
    private op1Cond(cmp: (c1: ExpCmp) => ExpCmp) {
        let e1 = this.arr.pop();
        this.arr.push(cmp(e1 as ExpCmp));
    }
    private op2Val(cmp: (c1: ExpVal, c2: ExpVal) => ExpVal) {
        let e2 = this.arr.pop(), e1 = this.arr.pop();
        this.arr.push(cmp(e1 as ExpVal, e2 as ExpVal));
    }
    private op1Val(cmp: (c1: ExpVal) => ExpVal) {
        let e1 = this.arr.pop();
        this.arr.push(cmp(e1 as ExpVal));
    }
    or() { this.op2Cond((c1, c2) => new ExpOr(c1, c2)); }
    and() { this.op2Cond((c1, c2) => new ExpAnd(c1, c2)); }
    not() { this.op1Cond(c1 => new ExpNot(c1)) }
    le() { this.op2Cmp((c1, c2) => new ExpLE(c1, c2)); }
    lt() { this.op2Cmp((c1, c2) => new ExpLT(c1, c2)); }
    eq() { this.op2Cmp((c1, c2) => new ExpEQ(c1, c2)); }
    ne() { this.op2Cmp((c1, c2) => new ExpNE(c1, c2)); }
    gt() { this.op2Cmp((c1, c2) => new ExpGT(c1, c2)); }
    ge() { this.op2Cmp((c1, c2) => new ExpGE(c1, c2)); }
    neg() { this.op1Val(c1 => new ExpNeg(c1)); }
    parenthese() { this.op1Val(c1 => new ExpParenthese(c1)); }
    add() { this.op2Val((c1, c2) => new ExpAdd(c1, c2)); }
    sub() { this.op2Val((c1, c2) => new ExpSub(c1, c2)); }
    mul() { this.op2Val((c1, c2) => new ExpMul(c1, c2)); }
    div() { this.op2Val((c1, c2) => new ExpDiv(c1, c2)); }
    decDiv() { this.op2Val((c1, c2) => new ExpDecDiv(c1, c2)); }
    mod() { this.op2Val((c1, c2) => new ExpMod(c1, c2)); }
    jsonProp(): void { this.op2Val((c1, c2) => new ExpJsonProp(c1, c2)); }
    bitAnd() { this.op2Val((c1, c2) => new ExpBitAnd(c1, c2)); }
    bitOr() { this.op2Val((c1, c2) => new ExpBitOr(c1, c2)); }
    bitInvert() { this.op1Val(c1 => new ExpBitInvert(c1)); }
    bitLeft() { this.op2Val((c1, c2) => new ExpBitLeft(c1, c2)); }
    bitRight() { this.op2Val((c1, c2) => new ExpBitRight(c1, c2)); }
    at(biz: BizBase, bizName: string[], bizVal: ValueExpression) {
        let item = this.arr.pop() as ExpVal;
        this.arr.push(new ExpAt(biz, item, bizName, this.context.convertExp(bizVal) as ExpVal));
    }
    str(val: string) { this.arr.push(new ExpStr(val)) }
    num(val: number) { this.arr.push(new ExpNum(val)) }
    star() { this.arr.push(new ExpStar()) }
    hex(val: string) { this.arr.push(new ExpHex(val)) }
    datePart(part: string): void { this.arr.push(new ExpDatePart(this.context.factory.getDatePart(part))) }
    isNull() { this.op1Cmp(c1 => new ExpIsNull(c1)) }
    isNotNull() { this.op1Cmp(c1 => new ExpIsNotNull(c1)) }
    exists() { this.op1Cmp(c1 => new ExpExists(c1 as any)) }
    of(tuidArr: TuidArr) {
        let val = this.arr.pop();
        this.arr.push(new ExpOf(val as ExpVal, tuidArr))
    }
    in(params: number) {
        let exps: ExpVal[] = [];
        for (let i = 0; i < params; i++) exps.unshift(this.arr.pop() as ExpVal);
        this.arr.push(new ExpIn(...exps));
    }
    like() { this.op2Cmp((c1, c2) => new ExpLike(c1, c2)); }
    searchCase(whenCount: number, hasElse: boolean) {
        let exps: Exp[] = [];
        let expElse: Exp;
        if (hasElse === true) expElse = this.arr.pop();
        for (let i = 0; i < whenCount; i++) {
            let v = this.arr.pop();
            let c = this.arr.pop();
            exps.push(c, v);
        }
        this.arr.push(new ExpSearchCase(exps, expElse));
    }
    simpleCase(whenCount: number, hasElse: boolean) {
        let expVal: Exp;
        let exps: Exp[] = [];
        let expElse: Exp;
        if (hasElse === true) expElse = this.arr.pop();
        for (let i = 0; i < whenCount; i++) {
            let v = this.arr.pop();
            let c = this.arr.pop();
            exps.push(c, v);
        }
        expVal = this.arr.pop();
        this.arr.push(new ExpSimpleCase(expVal, exps, expElse));
    }
    cast(dataType: DataType) {
        let v = this.arr.pop();
        this.arr.push(new ExpCast(v as ExpVal, dataType));
    }
    select(select: Select) {
        let sel = convertSelect(this.context, select);
        this.arr.push(new ExpSelect(sel))
    }
    func(func: string, n: number, isUqFunc: boolean) {
        let params: ExpVal[] = [];
        for (let i = 0; i < n; i++) params.unshift(this.arr.pop() as ExpVal);
        this.arr.push(new ExpFuncInUq(func, params, isUqFunc));
    }
    groupFunc(func: string, exp: ValueExpression) {
        this.arr.push(new ExpFuncInUq(func, [convertExp(this.context, exp) as ExpVal], false));
    }
    funcUqDefined(func: string, n: number) {
        let params: ExpVal[] = [];
        for (let i = 0; i < n; i++) params.unshift(this.arr.pop() as ExpVal);
        let { varUnit, varUser } = this.context;
        params.unshift(varUser);
        params.unshift(varUnit);
        this.arr.push(new ExpFuncInUq(func, params, true));
    }

    var(name: string) { this.arr.push(new ExpVar(name)) }
    field(name: string, tbl?: string) { this.arr.push(new ExpField(name, tbl)); }
    expr(exp: ValueExpression) { this.arr.push(convertExp(this.context, exp)) }
    dollarVar(name: string) { this.arr.push(new ExpDollarVar(name)) }
    match(varOperands: VarOperand[], against: ValueExpression, isBoolean: boolean) {
        let ops: Exp[] = [];
        for (let varOperand of varOperands) {
            varOperand.pointer.to(this, varOperand);
            ops.push(this.arr.pop());
        }
        this.arr.push(new ExpMatch(ops, convertExp(this.context, against), isBoolean));
    }
    typeof(entity: Entity, val: ValueExpression) {
        this.arr.push(new ExpTypeof(entity, convertExp(this.context, val) as ExpVal));
    }
    nameof(entity: Entity) {
        this.arr.push(new ExpNameof(entity));
    }
    role(role: string, valUnit: ValueExpression) {
        this.arr.push(new ExpRole(role, convertExp(this.context, valUnit) as ExpVal));
    }
    ID(entity: ID, forID: ID, newType: IDNewType
        , vals: ValueExpression[]
        , uuid: ValueExpression
        , stamp: ValueExpression
        , phrases: string[] | ValueExpression): void {
        let nPhrases: string[] | ExpVal;
        if (phrases !== undefined) {
            if (Array.isArray(nPhrases) === true) {
                nPhrases = phrases as string[];
            }
            else {
                nPhrases = this.context.convertExp(phrases as ValueExpression) as ExpVal;
            }
        }
        this.arr.push(
            new ExpID(entity, forID, newType
                , vals.map(v => convertExp(this.context, v) as ExpVal)
                , convertExp(this.context, uuid) as ExpVal
                , convertExp(this.context, stamp) as ExpVal
                , nPhrases
            )
        );
    }
    UMinute(stamp: ValueExpression): void {
        this.arr.push(new ExpUMinute(stamp === undefined ? undefined : convertExp(this.context, stamp) as ExpVal));
    }
    NO(entity: ID, stamp: ValueExpression): void {
        this.arr.push(new ExpNO(entity, convertExp(this.context, stamp) as ExpVal));
    }
    EntityId(val: ValueExpression): void {
        this.arr.push(new ExpEntityId(convertExp(this.context, val) as ExpVal));
    }
    EntityName(val: ValueExpression): void {
        this.arr.push(new ExpEntityName(convertExp(this.context, val) as ExpVal));
    }
    Queue(queue: Queue, of: ValueExpression, action: OpQueueAction, vals: ValueExpression[]): void {
        this.arr.push(new ExpQueue(queue, of, action, vals));
    }
    Search(key: ValueExpression, values: ValueExpression[]) {
        this.arr.push(new ExpSearch(key, values));
    }
    SpecId(spec: ValueExpression, atom: ValueExpression, values: ValueExpression): void {
        this.arr.push(
            new ExpFuncInUq(
                'specid'
                , [
                    this.context.expVal(spec)
                    , this.context.expVal(atom)
                    , this.context.expVal(values)
                ]
                , true
            )
        );
    }
    SpecValue(id: ValueExpression): void {
        this.arr.push(
            new ExpFuncInUq(
                'specvalue', [
                this.context.expVal(id)
            ], true
            )
        );
    }
}