"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertAtom = exports.convertExp = void 0;
const select_1 = require("../select");
const ExpQueue_1 = require("./ExpQueue");
const ExpID_1 = require("./ExpID");
const ExpNO_1 = require("./ExpNO");
const exps_1 = require("./exps");
const ExpUMinute_1 = require("./ExpUMinute");
const ExpSearch_1 = require("./ExpSearch");
const ExpBizOperand_1 = require("./ExpBizOperand");
const tools_1 = require("../../tools");
const ExpRole_1 = require("./ExpRole");
const ExpBizEntityBud_1 = require("./ExpBizEntityBud");
const ExpFuncBetween_1 = require("./ExpFuncBetween");
const ExpUpField_1 = require("./ExpUpField");
function convertExpInternal(stack, exp) {
    if (!exp)
        return;
    // let stack = new Stack(context);
    for (let atom of exp.getAtoms()) {
        atom.to(stack);
    }
    let ret = stack.getExp();
    return ret;
}
function convertExp(context, exp) {
    let stack = new Stack(context);
    return convertExpInternal(stack, exp);
}
exports.convertExp = convertExp;
function convertAtom(context, atom) {
    let stack = new Stack(context);
    atom.to(stack);
    return stack.getExp();
}
exports.convertAtom = convertAtom;
class Stack {
    constructor(context) {
        this.arr = [];
        this.context = context;
    }
    getExp() {
        if (this.arr.length === 0) {
            debugger;
            return;
        }
        let ret = this.arr.pop();
        return ret;
    }
    op2Cmp(cmp) {
        let e2 = this.arr.pop(), e1 = this.arr.pop();
        this.arr.push(cmp(e1, e2));
    }
    op1Cmp(cmp) {
        let e1 = this.arr.pop();
        this.arr.push(cmp(e1));
    }
    op2Cond(cmp) {
        let e2 = this.arr.pop(), e1 = this.arr.pop();
        this.arr.push(cmp(e1, e2));
    }
    op1Cond(cmp) {
        let e1 = this.arr.pop();
        this.arr.push(cmp(e1));
    }
    op2Val(cmp) {
        let e2 = this.arr.pop(), e1 = this.arr.pop();
        this.arr.push(cmp(e1, e2));
    }
    op1Val(cmp) {
        let e1 = this.arr.pop();
        this.arr.push(cmp(e1));
    }
    or() { this.op2Cond((c1, c2) => new exps_1.ExpOr(c1, c2)); }
    and() { this.op2Cond((c1, c2) => new exps_1.ExpAnd(c1, c2)); }
    not() { this.op1Cond(c1 => new exps_1.ExpNot(c1)); }
    le() { this.op2Cmp((c1, c2) => new exps_1.ExpLE(c1, c2)); }
    lt() { this.op2Cmp((c1, c2) => new exps_1.ExpLT(c1, c2)); }
    eq() { this.op2Cmp((c1, c2) => new exps_1.ExpEQ(c1, c2)); }
    questionEq() { this.op2Cmp((c1, c2) => new exps_1.ExpQuestionEQ(c1, c2)); }
    ne() { this.op2Cmp((c1, c2) => new exps_1.ExpNE(c1, c2)); }
    gt() { this.op2Cmp((c1, c2) => new exps_1.ExpGT(c1, c2)); }
    ge() { this.op2Cmp((c1, c2) => new exps_1.ExpGE(c1, c2)); }
    neg() { this.op1Val(c1 => new exps_1.ExpNeg(c1)); }
    parenthese() { this.op1Val(c1 => new exps_1.ExpParenthese(c1)); }
    add() { this.op2Val((c1, c2) => new exps_1.ExpAdd(c1, c2)); }
    sub() { this.op2Val((c1, c2) => new exps_1.ExpSub(c1, c2)); }
    mul() { this.op2Val((c1, c2) => new exps_1.ExpMul(c1, c2)); }
    div() { this.op2Val((c1, c2) => new exps_1.ExpDiv(c1, c2)); }
    decDiv() { this.op2Val((c1, c2) => new exps_1.ExpDecDiv(c1, c2)); }
    mod() { this.op2Val((c1, c2) => new exps_1.ExpMod(c1, c2)); }
    jsonProp() { this.op2Val((c1, c2) => new exps_1.ExpJsonProp(c1, c2)); }
    bitAnd() { this.op2Val((c1, c2) => new exps_1.ExpBitAnd(c1, c2)); }
    bitOr() { this.op2Val((c1, c2) => new exps_1.ExpBitOr(c1, c2)); }
    bitInvert() { this.op1Val(c1 => new exps_1.ExpBitInvert(c1)); }
    bitLeft() { this.op2Val((c1, c2) => new exps_1.ExpBitLeft(c1, c2)); }
    bitRight() { this.op2Val((c1, c2) => new exps_1.ExpBitRight(c1, c2)); }
    at(biz, bizName, bizVal) {
        let item = this.arr.pop();
        this.arr.push(new exps_1.ExpAt(biz, item, bizName, this.context.convertExp(bizVal)));
    }
    str(val) { this.arr.push(new exps_1.ExpStr(val)); }
    num(val) { this.arr.push(new exps_1.ExpNum(val)); }
    star() { this.arr.push(new exps_1.ExpStar()); }
    hex(val) { this.arr.push(new exps_1.ExpHex(val)); }
    datePart(part) { this.arr.push(new exps_1.ExpDatePart(this.context.factory.getDatePart(part))); }
    isNull() { this.op1Cmp(c1 => new exps_1.ExpIsNull(c1)); }
    isNotNull() { this.op1Cmp(c1 => new exps_1.ExpIsNotNull(c1)); }
    isIdType(bizEntities) { this.op1Cmp(c1 => new exps_1.ExpIsIdType(c1, bizEntities)); }
    exists() { this.op1Cmp(c1 => new exps_1.ExpExists(c1)); }
    of(tuidArr) {
        let val = this.arr.pop();
        this.arr.push(new exps_1.ExpOf(val, tuidArr));
    }
    in(params) {
        let exps = [];
        for (let i = 0; i < params; i++)
            exps.unshift(this.arr.pop());
        this.arr.push(new exps_1.ExpIn(...exps));
    }
    like() { this.op2Cmp((c1, c2) => new exps_1.ExpLike(c1, c2)); }
    searchCase(whenCount, hasElse) {
        let exps = [];
        let expElse;
        if (hasElse === true)
            expElse = this.arr.pop();
        for (let i = 0; i < whenCount; i++) {
            let v = this.arr.pop();
            let c = this.arr.pop();
            exps.push(c, v);
        }
        this.arr.push(new exps_1.ExpSearchCase(exps, expElse));
    }
    simpleCase(whenCount, hasElse) {
        let expVal;
        let exps = [];
        let expElse;
        if (hasElse === true)
            expElse = this.arr.pop();
        for (let i = 0; i < whenCount; i++) {
            let v = this.arr.pop();
            let c = this.arr.pop();
            exps.push(c, v);
        }
        expVal = this.arr.pop();
        this.arr.push(new exps_1.ExpSimpleCase(expVal, exps, expElse));
    }
    cast(dataType) {
        let v = this.arr.pop();
        this.arr.push(new exps_1.ExpCast(v, dataType));
    }
    select(select) {
        let sel = (0, select_1.convertSelect)(this.context, select);
        this.arr.push(new exps_1.ExpSelect(sel));
    }
    bizExp(exp) {
        let bExp = new tools_1.BBizExp();
        bExp.convertFrom(this.context, exp);
        this.arr.push(new ExpBizOperand_1.BizExpOperand(bExp));
    }
    bizCheckBud(checkBud) {
        const { optionIdVal, bizExp1, bizExp2, bizField, items } = checkBud;
        let bExp1;
        if (bizExp1 !== undefined) {
            bExp1 = new tools_1.BBizExp();
            bExp1.convertFrom(this.context, bizExp1);
        }
        let bExp2;
        if (bizExp2 !== undefined) {
            bExp2 = new tools_1.BBizExp();
            bExp2.convertFrom(this.context, bizExp2);
        }
        let bBizField;
        if (bizField !== undefined) {
            bBizField = bizField.field.db(this.context);
            bBizField.noArrayAgg = true;
        }
        let expOptionId = this.context.expVal(optionIdVal);
        this.arr.push(new tools_1.BBizCheckBud(expOptionId, bExp1, bExp2, bBizField, items));
    }
    bizFieldOperand(bizFieldOperand) {
        let { field } = bizFieldOperand;
        if (field === undefined) {
            // %user.x
            return;
        }
        let bBizField = field.db(this.context);
        let bBizFieldOperand = new tools_1.BBizFieldOperand(bBizField);
        this.arr.push(bBizFieldOperand);
    }
    bizBinUp(tblAlias, upField) {
        this.arr.push(new ExpUpField_1.ExpBinUpField(tblAlias, upField));
    }
    bizForkUp(tblAlias, upField) {
        this.arr.push(new ExpUpField_1.ExpBinUpField(tblAlias, upField));
    }
    func(func, n, isUqFunc) {
        let params = [];
        for (let i = 0; i < n; i++)
            params.unshift(this.arr.pop());
        this.arr.push(new exps_1.ExpFuncInUq(func, params, isUqFunc));
    }
    groupFunc(func, exp) {
        this.arr.push(new exps_1.ExpFuncInUq(func, [convertExp(this.context, exp)], false));
    }
    funcUqDefined(func, n) {
        let params = [];
        for (let i = 0; i < n; i++)
            params.unshift(this.arr.pop());
        let { varUnit, varUser } = this.context;
        params.unshift(varUser);
        params.unshift(varUnit);
        this.arr.push(new exps_1.ExpFuncInUq(func, params, true));
    }
    var(name) { this.arr.push(new exps_1.ExpVar(name)); }
    varOfBizEntity(bizFromEntity, bud) {
        this.arr.push(new ExpBizEntityBud_1.ExpBizEntityBud(bizFromEntity, bud));
    }
    dotVar(varNames) { this.arr.push(new exps_1.ExpDotVar(varNames)); }
    field(name, tbl) { this.arr.push(new exps_1.ExpField(name, tbl)); }
    expr(exp) { this.arr.push(convertExp(this.context, exp)); }
    dollarVar(name) { this.arr.push(new exps_1.ExpDollarVar(name)); }
    match(varOperands, against, isBoolean) {
        let ops = [];
        for (let varOperand of varOperands) {
            varOperand.pointer.to(this, varOperand);
            ops.push(this.arr.pop());
        }
        this.arr.push(new exps_1.ExpMatch(ops, convertExp(this.context, against), isBoolean));
    }
    typeof(entity, val) {
        this.arr.push(new exps_1.ExpTypeof(entity, convertExp(this.context, val)));
    }
    nameof(entity) {
        this.arr.push(new exps_1.ExpNameof(entity));
    }
    role(role, valUnit) {
        this.arr.push(new ExpRole_1.ExpRole(role, convertExp(this.context, valUnit)));
    }
    ID(entity, forID, newType, vals, uuid, stamp, phrases) {
        let nPhrases;
        if (phrases !== undefined) {
            if (Array.isArray(nPhrases) === true) {
                nPhrases = phrases;
            }
            else {
                nPhrases = this.context.convertExp(phrases);
            }
        }
        this.arr.push(new ExpID_1.ExpID(entity, forID, newType, vals.map(v => convertExp(this.context, v)), convertExp(this.context, uuid), convertExp(this.context, stamp), nPhrases));
    }
    UMinute(stamp) {
        this.arr.push(new ExpUMinute_1.ExpUMinute(stamp === undefined ? undefined : convertExp(this.context, stamp)));
    }
    NO(entity, stamp) {
        this.arr.push(new ExpNO_1.ExpNO(entity, convertExp(this.context, stamp)));
    }
    EntityId(val) {
        this.arr.push(new exps_1.ExpEntityId(convertExp(this.context, val)));
    }
    EntityName(val) {
        this.arr.push(new exps_1.ExpEntityName(convertExp(this.context, val)));
    }
    Queue(queue, of, action, vals) {
        this.arr.push(new ExpQueue_1.ExpQueue(queue, of, action, vals));
    }
    Search(key, values) {
        this.arr.push(new ExpSearch_1.ExpSearch(key, values));
    }
    FuncBetween(funcBetween) {
        const { value, left, right } = funcBetween;
        this.arr.push(new ExpFuncBetween_1.ExpFuncBetween(funcBetween, this.context.expVal(value), this.context.expVal(left), this.context.expVal(right)));
    }
}
//# sourceMappingURL=convertExp.js.map