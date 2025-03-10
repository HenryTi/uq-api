"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpDollarVar = exports.OpNotBetween = exports.OpBetween = exports.OpLike = exports.SubSelectOperand = exports.OpIn = exports.OpIsIdType = exports.OpIsNotNull = exports.OpIsNull = exports.ExistsSubOperand = exports.DatePartOperand = exports.OpConverter = exports.StarOperand = exports.OpUqDefinedFunction = exports.OpGroupCountFunc = exports.OpGroupFunc = exports.OpFunction = exports.OpCast = exports.OpSimpleCase = exports.OpSearchCase = exports.NullOperand = exports.HexOperand = exports.NumberOperand = exports.TextOperand = exports.OpAt = exports.OpJsonProp = exports.OpParenthese = exports.OpNeg = exports.OpBitRight = exports.OpBitLeft = exports.OpBitwiseInvert = exports.OpBitwiseOr = exports.OpBitwiseAnd = exports.OpMod = exports.OpDecDiv = exports.OpDiv = exports.OpMul = exports.OpSub = exports.OpAdd = exports.OpGE = exports.OpGT = exports.OpNE = exports.OpQuestionEQ = exports.OpEQ = exports.OpLT = exports.OpLE = exports.OpNot = exports.OpAnd = exports.OpOr = exports.Atom = void 0;
exports.FuncBetween = exports.EnumFuncBetweenCompare = exports.EnumFuncBetweenType = exports.OpSearch = exports.OpQueue = exports.OpQueueAction = exports.OpEntityName = exports.OpEntityId = exports.OpNO = exports.OpUMinute = exports.OpID = exports.IDNewType = exports.OpRole = exports.OpNameof = exports.OpTypeof = exports.OpMatch = exports.VarOperand = void 0;
const parser_1 = require("../../parser");
const IElement_1 = require("../IElement");
const select_1 = require("../select");
class Atom extends IElement_1.IElement {
    get type() { return 'atom'; }
    get scalarValue() { return undefined; }
    parser(context) { return; }
}
exports.Atom = Atom;
class OpOr extends Atom {
    to(stack) { stack.or(); }
}
exports.OpOr = OpOr;
class OpAnd extends Atom {
    to(stack) { stack.and(); }
}
exports.OpAnd = OpAnd;
class OpNot extends Atom {
    to(stack) { stack.not(); }
}
exports.OpNot = OpNot;
class OpLE extends Atom {
    to(stack) { stack.le(); }
}
exports.OpLE = OpLE;
class OpLT extends Atom {
    to(stack) { stack.lt(); }
}
exports.OpLT = OpLT;
class OpEQ extends Atom {
    to(stack) { stack.eq(); }
}
exports.OpEQ = OpEQ;
class OpQuestionEQ extends Atom {
    to(stack) { stack.questionEq(); }
}
exports.OpQuestionEQ = OpQuestionEQ;
class OpNE extends Atom {
    to(stack) { stack.ne(); }
}
exports.OpNE = OpNE;
class OpGT extends Atom {
    to(stack) { stack.gt(); }
}
exports.OpGT = OpGT;
class OpGE extends Atom {
    to(stack) { stack.ge(); }
}
exports.OpGE = OpGE;
class OpAdd extends Atom {
    to(stack) { stack.add(); }
}
exports.OpAdd = OpAdd;
class OpSub extends Atom {
    to(stack) { stack.sub(); }
}
exports.OpSub = OpSub;
class OpMul extends Atom {
    to(stack) { stack.mul(); }
}
exports.OpMul = OpMul;
class OpDiv extends Atom {
    to(stack) { stack.div(); }
}
exports.OpDiv = OpDiv;
class OpDecDiv extends Atom {
    to(stack) { stack.decDiv(); }
}
exports.OpDecDiv = OpDecDiv;
class OpMod extends Atom {
    to(stack) { stack.mod(); }
}
exports.OpMod = OpMod;
class OpBitwiseAnd extends Atom {
    to(stack) { stack.bitAnd(); }
}
exports.OpBitwiseAnd = OpBitwiseAnd;
class OpBitwiseOr extends Atom {
    to(stack) { stack.bitOr(); }
}
exports.OpBitwiseOr = OpBitwiseOr;
class OpBitwiseInvert extends Atom {
    to(stack) { stack.bitInvert(); }
}
exports.OpBitwiseInvert = OpBitwiseInvert;
class OpBitLeft extends Atom {
    to(stack) { stack.bitLeft(); }
}
exports.OpBitLeft = OpBitLeft;
class OpBitRight extends Atom {
    to(stack) { stack.bitRight(); }
}
exports.OpBitRight = OpBitRight;
class OpNeg extends Atom {
    to(stack) { stack.neg(); }
}
exports.OpNeg = OpNeg;
class OpParenthese extends Atom {
    to(stack) { stack.parenthese(); }
}
exports.OpParenthese = OpParenthese;
class OpJsonProp extends Atom {
    to(stack) { stack.jsonProp(); }
}
exports.OpJsonProp = OpJsonProp;
class OpAt extends Atom {
    to(stack) { stack.at(this.biz, this.bizName, this.bizVal); }
    parser(context) {
        return this.pelement = new parser_1.POpAt(this, context);
    }
}
exports.OpAt = OpAt;
class TextOperand extends Atom {
    get type() { return 'string'; }
    get scalarValue() { return this.text; }
    constructor(text) {
        super();
        this.text = text;
    }
    to(stack) { stack.str(this.text); }
}
exports.TextOperand = TextOperand;
class NumberOperand extends Atom {
    get type() { return 'number'; }
    get scalarValue() { return this.num; }
    constructor(num) {
        super();
        this.num = num;
    }
    to(stack) { stack.num(this.num); }
}
exports.NumberOperand = NumberOperand;
class HexOperand extends Atom {
    get type() { return 'hex'; }
    get scalarValue() { return Number.parseInt(this.text, 16); }
    constructor(text) {
        super();
        this.text = text;
    }
    to(stack) { stack.hex(this.text); }
}
exports.HexOperand = HexOperand;
class NullOperand extends Atom {
    get scalarValue() { return null; }
    to(stack) { stack.hex('null'); }
}
exports.NullOperand = NullOperand;
class OpSearchCase extends Atom {
    constructor(whenCount, hasElse) {
        super();
        this.whenCount = whenCount;
        this.hasElse = hasElse;
    }
    to(stack) { stack.searchCase(this.whenCount, this.hasElse); }
}
exports.OpSearchCase = OpSearchCase;
class OpSimpleCase extends Atom {
    constructor(whenCount, hasElse) {
        super();
        this.whenCount = whenCount;
        this.hasElse = hasElse;
    }
    to(stack) { stack.simpleCase(this.whenCount, this.hasElse); }
}
exports.OpSimpleCase = OpSimpleCase;
class OpCast extends Atom {
    parser(context) { return this.pelement = new parser_1.POpCast(this, context); }
    to(stack) {
        stack.cast(this.dataType);
    }
}
exports.OpCast = OpCast;
class OpFunction extends Atom {
    constructor(func, paramCount, isUqFunc = false) {
        super();
        this.func = func;
        this.paramCount = paramCount;
        this.isUqFunc = isUqFunc;
    }
    to(stack) { stack.func(this.func, this.paramCount, this.isUqFunc); }
}
exports.OpFunction = OpFunction;
class OpGroupFunc extends Atom {
    constructor(func) {
        super();
        this.func = func;
    }
    parser(context) { return new parser_1.POpGroupFunc(this, context); }
    to(stack) { stack.groupFunc(this.func, this.value); }
}
exports.OpGroupFunc = OpGroupFunc;
class OpGroupCountFunc extends OpGroupFunc {
    parser(context) { return new parser_1.POpGroupCountFunc(this, context); }
}
exports.OpGroupCountFunc = OpGroupCountFunc;
class OpUqDefinedFunction extends Atom {
    constructor(func, paramCount) {
        super();
        this.func = func;
        this.paramCount = paramCount;
    }
    parser(context) { return new parser_1.POpUqDefinedFunction(this, context); }
    to(stack) { stack.funcUqDefined(this.func, this.paramCount); }
}
exports.OpUqDefinedFunction = OpUqDefinedFunction;
class StarOperand extends Atom {
    to(stack) { stack.star(); }
}
exports.StarOperand = StarOperand;
class OpConverter extends Atom {
    constructor(dataType, paramCount) {
        super();
        this.dataType = dataType;
        this.paramCount = paramCount;
    }
    to(stack) { }
}
exports.OpConverter = OpConverter;
class DatePartOperand extends Atom {
    constructor(datePart) {
        super();
        this.datePart = datePart;
    }
    to(stack) { stack.datePart(this.datePart); }
}
exports.DatePartOperand = DatePartOperand;
class ExistsSubOperand extends Atom {
    to(stack) { stack.exists(); }
}
exports.ExistsSubOperand = ExistsSubOperand;
class OpIsNull extends Atom {
    to(stack) { stack.isNull(); }
}
exports.OpIsNull = OpIsNull;
class OpIsNotNull extends Atom {
    to(stack) { stack.isNotNull(); }
}
exports.OpIsNotNull = OpIsNotNull;
class OpIsIdType extends Atom {
    constructor() {
        super(...arguments);
        this.bizEntities = [];
    }
    parser(context) { return new parser_1.POpIsIdType(this, context); }
    to(stack) { stack.isIdType(this.bizEntities); }
}
exports.OpIsIdType = OpIsIdType;
class OpIn extends Atom {
    constructor(params) {
        super();
        this.params = params;
    }
    to(stack) { stack.in(this.params); }
}
exports.OpIn = OpIn;
class SubSelectOperand extends Atom {
    get type() { return 'select'; }
    constructor() {
        super();
        this.select = new select_1.Select();
        this.select.isValue = true;
    }
    parser(context) { return this.pelement = this.select.parser(context); }
    to(stack) { stack.select(this.select); }
}
exports.SubSelectOperand = SubSelectOperand;
class OpLike extends Atom {
    to(stack) { stack.like(); }
}
exports.OpLike = OpLike;
class OpBetween extends Atom {
    to(stack) { }
}
exports.OpBetween = OpBetween;
class OpNotBetween extends Atom {
    to(stack) { }
}
exports.OpNotBetween = OpNotBetween;
const dollarVars = [
    'unit', 'user', 'site', 'insite', 'stamp', 'importing',
    'pagestart', 'pagesize',
    'date', 'id', 'state', 'row', 'sheet_date', 'sheet_no', 'sheet_discription'
];
class OpDollarVar extends Atom {
    static isValid(name) { return dollarVars.find(v => v === name) !== undefined; }
    constructor(_var) { super(); this._var = _var; }
    to(stack) { stack.dollarVar(this._var); }
    parser(context) { return new parser_1.POpDollarVar(this, context); }
}
exports.OpDollarVar = OpDollarVar;
class VarOperand extends Atom {
    constructor() {
        super(...arguments);
        this.dotFirst = false;
        this._var = [];
    }
    get type() { return 'var'; }
    parser(context) { return new parser_1.PVarOperand(this, context); }
    to(stack) {
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
    isSameVar(v) {
        if (this._var.length !== 1)
            return false;
        if (v._var.length !== 1)
            return false;
        return this._var[0] === v._var[0];
    }
    get scalarValue() {
        // return undefined; 
        if (this._var.length !== 2)
            return undefined;
        return this._var;
    }
}
exports.VarOperand = VarOperand;
class OpMatch extends Atom {
    get type() { return 'match'; }
    parser(context) { return new parser_1.PMatchOperand(this, context); }
    to(stack) {
        stack.match(this.varOperands, this.against, this.isBoolean);
    }
}
exports.OpMatch = OpMatch;
class OpTypeof extends Atom {
    get type() { return 'typeof'; }
    parser(context) { return new parser_1.POpTypeof(this, context); }
    to(stack) {
        stack.typeof(this.entity, this.val);
    }
}
exports.OpTypeof = OpTypeof;
class OpNameof extends Atom {
    get type() { return 'nameof'; }
    parser(context) { return new parser_1.POpNameof(this, context); }
    to(stack) {
        stack.nameof(this.entity);
    }
}
exports.OpNameof = OpNameof;
class OpRole extends Atom {
    get type() { return 'role'; }
    parser(context) { return new parser_1.POpRole(this, context); }
    to(stack) {
        stack.role(this.role, this.unit);
    }
}
exports.OpRole = OpRole;
var IDNewType;
(function (IDNewType) {
    IDNewType[IDNewType["get"] = 0] = "get";
    IDNewType[IDNewType["new"] = 1] = "new";
    IDNewType[IDNewType["newIfNull"] = 2] = "newIfNull";
    IDNewType[IDNewType["create"] = 3] = "create";
    IDNewType[IDNewType["prev"] = 99] = "prev";
})(IDNewType || (exports.IDNewType = IDNewType = {}));
class OpID extends Atom {
    constructor() {
        super(...arguments);
        this.newType = IDNewType.get;
        this.vals = [];
    }
    get type() { return 'ID'; }
    parser(context) { return new parser_1.POpID(this, context); }
    to(stack) {
        stack.ID(this.id, this.forID, this.newType, this.vals, this.uuid, this.stamp, this.phrases);
    }
}
exports.OpID = OpID;
class OpUMinute extends Atom {
    get type() { return 'uminute'; }
    parser(context) { return new parser_1.POpUMinute(this, context); }
    to(stack) {
        stack.UMinute(this.stamp);
    }
}
exports.OpUMinute = OpUMinute;
class OpNO extends Atom {
    get type() { return 'NO'; }
    parser(context) { return new parser_1.POpNO(this, context); }
    to(stack) {
        stack.NO(this.id, this.stamp);
    }
}
exports.OpNO = OpNO;
class OpEntityId extends Atom {
    get type() { return 'EntityId'; }
    parser(context) { return new parser_1.POpEntityId(this, context); }
    to(stack) {
        stack.EntityId(this.val);
    }
}
exports.OpEntityId = OpEntityId;
class OpEntityName extends Atom {
    get type() { return 'EntityName'; }
    parser(context) { return new parser_1.POpEntityName(this, context); }
    to(stack) {
        stack.EntityName(this.val);
    }
}
exports.OpEntityName = OpEntityName;
var OpQueueAction;
(function (OpQueueAction) {
    OpQueueAction[OpQueueAction["has"] = 0] = "has";
    OpQueueAction[OpQueueAction["wait"] = 1] = "wait";
    OpQueueAction[OpQueueAction["done"] = 2] = "done";
})(OpQueueAction || (exports.OpQueueAction = OpQueueAction = {}));
class OpQueue extends Atom {
    get type() { return 'queue'; }
    parser(context) { return new parser_1.POpQueue(this, context); }
    to(stack) {
        stack.Queue(this.queue, this.ix, this.action, this.vals);
    }
}
exports.OpQueue = OpQueue;
class OpSearch extends Atom {
    get type() { return 'search'; }
    parser(context) { return new parser_1.POpSearch(this, context); }
    to(stack) {
        stack.Search(this.key, this.values);
    }
}
exports.OpSearch = OpSearch;
var EnumFuncBetweenType;
(function (EnumFuncBetweenType) {
    EnumFuncBetweenType[EnumFuncBetweenType["iddate"] = 1] = "iddate";
    EnumFuncBetweenType[EnumFuncBetweenType["date"] = 2] = "date";
    EnumFuncBetweenType[EnumFuncBetweenType["int"] = 3] = "int";
    EnumFuncBetweenType[EnumFuncBetweenType["dec"] = 4] = "dec";
})(EnumFuncBetweenType || (exports.EnumFuncBetweenType = EnumFuncBetweenType = {}));
var EnumFuncBetweenCompare;
(function (EnumFuncBetweenCompare) {
    EnumFuncBetweenCompare[EnumFuncBetweenCompare["inclusive"] = 1] = "inclusive";
    EnumFuncBetweenCompare[EnumFuncBetweenCompare["exclusive"] = 0] = "exclusive";
})(EnumFuncBetweenCompare || (exports.EnumFuncBetweenCompare = EnumFuncBetweenCompare = {}));
class FuncBetween extends Atom {
    constructor() {
        super(...arguments);
        this.leftCompare = EnumFuncBetweenCompare.inclusive;
        this.rightCompare = EnumFuncBetweenCompare.exclusive;
    }
    get type() { return 'funcbetween'; }
    parser(context) { return new parser_1.PFuncBetween(this, context); }
    to(stack) {
        stack.FuncBetween(this);
    }
}
exports.FuncBetween = FuncBetween;
//# sourceMappingURL=Op.js.map