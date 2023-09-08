"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpAtVar = exports.ExpSelect = exports.ExpFuncInUq = exports.ExpCast = exports.ExpSimpleCase = exports.ExpSearchCase = exports.ExpFuncCustom = exports.ExpFuncDb = exports.ExpFunc = exports.ExpNE = exports.ExpLE = exports.ExpGE = exports.ExpLT = exports.ExpGT = exports.ExpEQBinary = exports.ExpEQ = exports.ExpLike = exports.Exp2Cmp = exports.ExpUnitCmp = exports.ExpIn = exports.ExpIsNotNull = exports.ExpIsNull = exports.ExpDatePart = exports.ExpBitLeft = exports.ExpBitRight = exports.ExpBitOr = exports.ExpBitAnd = exports.ExpMod = exports.ExpDecDiv = exports.ExpDiv = exports.ExpMul = exports.ExpSub = exports.ExpAdd = exports.ExpBitInvert = exports.ExpParenthese = exports.ExpNeg = exports.ExpAtEQ = exports.ExpVar = exports.ExpParam = exports.ExpField = exports.ExpHex = exports.ExpStar = exports.ExpNum = exports.ExpStr = exports.ExpAt = exports.ExpOr = exports.ExpAnd = exports.ExpNot = exports.ExpCmp = exports.ExpVal = void 0;
exports.ExpMatch = exports.ExpNull = exports.ExpKey = exports.ExpEntityName = exports.ExpEntityId = exports.ExpNameof = exports.ExpTypeof = exports.ExpOf = exports.ExpExists = exports.ExpDollarVar = void 0;
const sqlBuilder_1 = require("../sqlBuilder");
const statementWithFrom_1 = require("../statementWithFrom");
const Exp_1 = require("./Exp");
const dbContext_1 = require("../../dbContext");
class ExpVal extends Exp_1.Exp {
    constructor() {
        super(...arguments);
        this.brace = false;
    }
}
exports.ExpVal = ExpVal;
class ExpCmp extends Exp_1.Exp {
    get voided() { return false; }
}
exports.ExpCmp = ExpCmp;
class Exp1Cmp extends ExpCmp {
    get voided() { return this.opd.voided; }
    constructor(opd) { super(); this.opd = opd; }
}
class ExpNot extends Exp1Cmp {
    to(sb) {
        if (this.opd.voided === true)
            return;
        sb.append('NOT ').l().exp(this.opd).r();
    }
}
exports.ExpNot = ExpNot;
class ExpCmps extends ExpCmp {
    get voided() { for (let opd of this.opds)
        if (opd.voided === true)
            return true; return false; }
    to(sb) {
        if (this.opds.length === 0) {
            sb.space();
            sb.append(this.placeHolder);
            return;
        }
        let i = 0, len = this.opds.length;
        for (; i < len; i++) {
            let opd = this.opds[i];
            if (opd === undefined)
                continue;
            if (opd.voided === false) {
                opd.to(sb);
                ++i;
                break;
            }
        }
        for (; i < len; i++) {
            let opd = this.opds[i];
            if (opd === undefined)
                continue;
            if (opd.voided === true)
                continue;
            sb.append(this.op);
            opd.to(sb);
        }
    }
    constructor(...opds) {
        super();
        this.opds = [];
        this.opds = opds;
    }
}
class ExpAnd extends ExpCmps {
    get op() { return ' AND '; }
    get placeHolder() { return '1=1'; }
}
exports.ExpAnd = ExpAnd;
class ExpOr extends ExpCmps {
    to(sb) {
        sb.l();
        super.to(sb);
        sb.r();
    }
    get op() { return ' OR '; }
    get placeHolder() { return '1=0'; }
}
exports.ExpOr = ExpOr;
class ExpAt extends ExpVal {
    to(sb) {
        sb.l().append('select a1.id from bindphrase as a1 JOIN $phrase as b1 on b1.id=a1.phrase where a1.base=')
            .exp(this.item)
            .append(' and b1.name=');
        if (this.bizName !== undefined) {
            sb.string(this.bizName.join('.'));
        }
        else {
            sb.exp(this.bizVal);
        }
        sb.r();
    }
    constructor(biz, item, bizName, bizVal) {
        super();
        this.biz = biz;
        this.item = item;
        this.bizName = bizName;
        this.bizVal = bizVal;
    }
}
exports.ExpAt = ExpAt;
class ExpStr extends ExpVal {
    to(sb) { sb.append('\'').append(this.value).append('\''); }
    constructor(value) { super(); this.value = value; }
}
exports.ExpStr = ExpStr;
class ExpNum extends ExpVal {
    to(sb) { sb.append(this.num.toString()); }
    constructor(num) { super(); this.num = num; }
}
exports.ExpNum = ExpNum;
class ExpStar extends ExpVal {
    to(sb) {
        sb.append('*');
    }
}
exports.ExpStar = ExpStar;
class ExpHex extends ExpVal {
    to(sb) { sb.append(this.value); }
    constructor(value) { super(); this.value = value; }
}
exports.ExpHex = ExpHex;
class ExpField extends ExpVal {
    to(sb) {
        if (sb.fieldValue0 === true) {
            sb.append('0');
        }
        else {
            sb.aliasDot(this.tbl).fld(this.name).collate(this.collate);
        }
    }
    constructor(name, tbl, collate) {
        super();
        this.tbl = tbl;
        this.name = name;
        this.collate = collate;
    }
}
exports.ExpField = ExpField;
class ExpParam extends ExpVal {
    to(sb) {
        sb.param(this.name);
    }
    constructor(name) { super(); this.name = name; }
}
exports.ExpParam = ExpParam;
class ExpVar extends ExpVal {
    to(sb) {
        sb.var(this.name).collate(this.collate);
    }
    constructor(name, collate) {
        super();
        this.name = name;
        this.collate = collate;
    }
}
exports.ExpVar = ExpVar;
class ExpAtEQ extends ExpVal {
    to(sb) {
        sb.l().append('@').append(this.name).append(':=').exp(this.expVal).r();
    }
    constructor(name, expVal) {
        super();
        this.name = name;
        this.expVal = expVal;
    }
}
exports.ExpAtEQ = ExpAtEQ;
class ExpNeg extends ExpVal {
    to(sb) { sb.append('-('); this.val.to(sb); sb.r(); }
    constructor(val) { super(); this.val = val; }
}
exports.ExpNeg = ExpNeg;
class ExpParenthese extends ExpVal {
    to(sb) { sb.l(); this.val.to(sb); sb.r(); }
    constructor(val) { super(); this.val = val; }
}
exports.ExpParenthese = ExpParenthese;
class ExpBitInvert extends ExpVal {
    to(sb) { sb.append('~('); this.val.to(sb); sb.r(); }
    constructor(val) { super(); this.val = val; }
}
exports.ExpBitInvert = ExpBitInvert;
class ExpVals extends ExpVal {
    to(sb) {
        sb.sepStart(this.op);
        for (let v of this.vals) {
            sb.sep();
            let b = v.brace;
            if (b === true)
                sb.l();
            sb.exp(v);
            if (b === true)
                sb.r();
        }
        sb.sepEnd();
    }
    constructor(...vals) { super(); this.vals = vals; }
}
class ExpAdd extends ExpVals {
    constructor() {
        super(...arguments);
        this.brace = true;
    }
    get op() { return '+'; }
}
exports.ExpAdd = ExpAdd;
class ExpSub extends ExpVals {
    constructor() {
        super(...arguments);
        this.brace = true;
    }
    get op() { return '-'; }
}
exports.ExpSub = ExpSub;
class ExpMul extends ExpVals {
    get op() { return '*'; }
}
exports.ExpMul = ExpMul;
class ExpDiv extends ExpVals {
    get op() { return ' DIV '; }
}
exports.ExpDiv = ExpDiv;
class ExpDecDiv extends ExpVals {
    get op() { return '/'; }
}
exports.ExpDecDiv = ExpDecDiv;
class ExpMod extends ExpVals {
    get op() { return '%'; }
}
exports.ExpMod = ExpMod;
class ExpBitAnd extends ExpVals {
    get op() { return '&'; }
}
exports.ExpBitAnd = ExpBitAnd;
class ExpBitOr extends ExpVals {
    get op() { return '|'; }
}
exports.ExpBitOr = ExpBitOr;
class ExpBitRight extends ExpVals {
    constructor() {
        super(...arguments);
        this.brace = true;
    }
    get op() { return '>>'; }
}
exports.ExpBitRight = ExpBitRight;
class ExpBitLeft extends ExpVals {
    constructor() {
        super(...arguments);
        this.brace = true;
    }
    get op() { return '<<'; }
}
exports.ExpBitLeft = ExpBitLeft;
class ExpDatePart extends ExpVal {
    constructor(part) {
        super();
        this.part = part;
    }
    to(sb) { sb.append(this.part); }
}
exports.ExpDatePart = ExpDatePart;
class ExpIsNull extends ExpCmp {
    to(sb) { sb.exp(this.opd).append(' IS NULL'); }
    constructor(opd) { super(); this.opd = opd; }
}
exports.ExpIsNull = ExpIsNull;
class ExpIsNotNull extends ExpCmp {
    to(sb) { sb.exp(this.opd).append(' IS NOT NULL'); }
    constructor(opd) { super(); this.opd = opd; }
}
exports.ExpIsNotNull = ExpIsNotNull;
class ExpIn extends ExpCmp {
    to(sb) {
        sb.exp(this.exps[0]);
        sb.append(' IN ').l();
        let len = this.exps.length;
        sb.sepStart(',');
        for (let i = 1; i < len; i++)
            sb.sep().exp(this.exps[i]);
        sb.sepEnd();
        sb.r();
    }
    constructor(...exps) { super(); this.exps = exps; }
}
exports.ExpIn = ExpIn;
class ExpUnitCmp extends ExpCmp {
    constructor(unit, alias) {
        super();
        this.unit = unit;
        this.alias = alias;
    }
    get voided() { return this.unit === undefined; }
    to(sb) {
        if (this.unit === undefined)
            return;
        sb.aliasDot(this.alias).fld(this.unit.name).append('=').param(sqlBuilder_1.unitFieldName);
    }
}
exports.ExpUnitCmp = ExpUnitCmp;
class Exp2Cmp extends ExpCmp {
    to(sb) {
        sb.exp(this.op1).append(this.op).exp(this.op2);
    }
    constructor(op1, op2) { super(); this.op1 = op1; this.op2 = op2; }
}
exports.Exp2Cmp = Exp2Cmp;
class ExpLike extends Exp2Cmp {
    get op() { return ' LIKE '; }
}
exports.ExpLike = ExpLike;
class ExpEQ extends Exp2Cmp {
    get op() { return '='; }
}
exports.ExpEQ = ExpEQ;
class ExpEQBinary extends Exp2Cmp {
    get op() { return '='; }
    to(sb) {
        sb.append('binary').space();
        super.to(sb);
    }
}
exports.ExpEQBinary = ExpEQBinary;
class ExpGT extends Exp2Cmp {
    get op() { return '>'; }
}
exports.ExpGT = ExpGT;
class ExpLT extends Exp2Cmp {
    get op() { return '<'; }
}
exports.ExpLT = ExpLT;
class ExpGE extends Exp2Cmp {
    get op() { return '>='; }
}
exports.ExpGE = ExpGE;
class ExpLE extends Exp2Cmp {
    get op() { return '<='; }
}
exports.ExpLE = ExpLE;
class ExpNE extends Exp2Cmp {
    get op() { return '<>'; }
}
exports.ExpNE = ExpNE;
class ExpFunc extends ExpVal {
    constructor(funcName, ...params) {
        super();
        if (!funcName)
            debugger;
        this.fName = funcName;
        this.params = params;
    }
    to(sb) {
        sb.func(this.fName, this.params, false);
    }
}
exports.ExpFunc = ExpFunc;
class ExpFuncDb extends ExpFunc {
    constructor(db, funcName, ...params) {
        super(funcName, ...params);
        this.db = db;
    }
    to(sb) {
        sb.name(this.db).dot();
        super.to(sb);
    }
}
exports.ExpFuncDb = ExpFuncDb;
class ExpFuncCustom extends ExpVal {
    constructor(func, ...params) {
        super();
        this.func = func;
        this.params = params;
    }
    to(sb) {
        this.func(sb, this.params);
    }
}
exports.ExpFuncCustom = ExpFuncCustom;
class ExpSearchCase extends ExpVal {
    constructor(exps, expElse) {
        super();
        this.exps = exps;
        this.expElse = expElse;
    }
    to(sb) {
        sb.append('CASE');
        let len = this.exps.length;
        for (let i = 0; i < len;) {
            sb.append(' WHEN ');
            sb.exp(this.exps[i++]);
            sb.append(' THEN ');
            sb.exp(this.exps[i++]);
        }
        if (this.expElse !== undefined) {
            sb.append(' ELSE ');
            sb.exp(this.expElse);
        }
        sb.append(' END');
    }
}
exports.ExpSearchCase = ExpSearchCase;
class ExpSimpleCase extends ExpVal {
    constructor(expVal, exps, expElse) {
        super();
        this.expVal = expVal;
        this.exps = exps;
        this.expElse = expElse;
    }
    to(sb) {
        sb.append('CASE ');
        sb.exp(this.expVal);
        let len = this.exps.length;
        for (let i = 0; i < len;) {
            sb.append(' WHEN ');
            sb.exp(this.exps[i++]);
            sb.append(' THEN ');
            sb.exp(this.exps[i++]);
        }
        if (this.expElse !== undefined) {
            sb.append(' ELSE ');
            sb.exp(this.expElse);
        }
        sb.append(' END');
    }
}
exports.ExpSimpleCase = ExpSimpleCase;
class ExpCast extends ExpVal {
    constructor(param, dataType) {
        super();
        this.param = param;
        this.dataType = dataType;
    }
    to(sb) {
        sb.append('CAST').l();
        sb.exp(this.param).append(' AS ');
        this.dataType.sql(sb);
        sb.r();
    }
}
exports.ExpCast = ExpCast;
class ExpFuncInUq extends ExpVal {
    constructor(func, params, isUqFunc) {
        super();
        this.func = func;
        this.params = params;
        this.isUqFunc = isUqFunc;
    }
    to(sb) {
        let f = sb.factory['func_' + this.func];
        switch (typeof f) {
            default:
                sb.func(this.func, this.params, this.isUqFunc);
                break;
            case 'function':
                f(sb, this.params);
                break;
            case 'string':
                sb.func(f, this.params, this.isUqFunc);
                break;
        }
    }
}
exports.ExpFuncInUq = ExpFuncInUq;
class ExpSelect extends ExpVal {
    constructor(select) {
        super();
        this.select = select;
    }
    to(sb) {
        sb.l();
        this.select.to(sb, 0);
        sb.r();
    }
}
exports.ExpSelect = ExpSelect;
class ExpAtVar extends ExpVal {
    constructor(name) {
        super();
        this.name = name;
    }
    to(sb) {
        sb.append('@').append(this.name);
    }
}
exports.ExpAtVar = ExpAtVar;
class ExpDollarVar extends ExpVal {
    constructor(name) {
        super();
        this.name = name;
    }
    to(sb) {
        sb.var('$' + this.name);
    }
}
exports.ExpDollarVar = ExpDollarVar;
class ExpExists extends ExpCmp {
    constructor(select) {
        super();
        this.select = select;
    }
    to(sb) {
        sb.exists(this.select);
    }
}
exports.ExpExists = ExpExists;
class ExpOf extends Exp_1.Exp {
    constructor(val, tuidArr) {
        super();
        this.val = val;
        this.tuidArr = tuidArr;
    }
    to(sb) {
        sb.l();
        let select = sb.factory.createSelect();
        // tuid arr 表没有unit
        let hasUnit = false;
        select.col('$owner');
        select.from(new statementWithFrom_1.EntityTable(this.tuidArr.getTableName(), hasUnit));
        select.where(new ExpEQ(new ExpField(this.tuidArr.id.name), this.val));
        select.to(sb, 0);
        sb.r();
    }
}
exports.ExpOf = ExpOf;
class ExpTypeof extends Exp_1.Exp {
    constructor(entity, val) {
        super();
        this.entity = entity;
        this.val = val;
    }
    to(sb) {
        sb.l();
        let select = sb.factory.createSelect();
        // tuid arr 表没有unit
        let hasUnit = false;
        select.col('id');
        select.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity));
        select.where(new ExpEQ(new ExpField('name'), this.entity ? new ExpStr(this.entity.name) : this.val));
        select.to(sb, 0);
        sb.r();
    }
}
exports.ExpTypeof = ExpTypeof;
class ExpNameof extends Exp_1.Exp {
    constructor(entity) {
        super();
        this.entity = entity;
    }
    to(sb) {
        sb.l();
        sb.string(this.entity.name);
        sb.r();
    }
}
exports.ExpNameof = ExpNameof;
class ExpEntityId extends Exp_1.Exp {
    constructor(val) {
        super();
        this.val = val;
    }
    to(sb) {
        sb.l().append('select entity from ')
            .dbName().dot().entityTableName(dbContext_1.EnumSysTable.id_u)
            .append(' where id=').exp(this.val).r();
    }
}
exports.ExpEntityId = ExpEntityId;
class ExpEntityName extends Exp_1.Exp {
    constructor(val) {
        super();
        this.val = val;
    }
    to(sb) {
        sb.l().append('select b.name from ')
            .dbName().dot().entityTableName(dbContext_1.EnumSysTable.id_u)
            .append(' as a join ').entityTableName('$entity')
            .append(' as b ON a.entity=b.id where a.id=').exp(this.val).r();
    }
}
exports.ExpEntityName = ExpEntityName;
class ExpKey extends ExpVal {
    constructor(key) {
        super();
        this.key = key;
    }
    to(sb) {
        sb.key(this.key);
    }
}
exports.ExpKey = ExpKey;
class ExpNull extends ExpVal {
    to(sb) {
        sb.append('NULL');
    }
}
exports.ExpNull = ExpNull;
class ExpMatch extends ExpCmp {
    constructor(varOperands, exp, isBoolean) {
        super();
        this.varOperands = varOperands;
        this.exp = exp;
        this.isBoolean = isBoolean;
    }
    to(sb) {
        sb.append('match ').l();
        let first = true;
        for (let v of this.varOperands) {
            if (first === true) {
                first = false;
            }
            else {
                sb.comma();
            }
            sb.exp(v);
        }
        sb.r();
        sb.append(' against ');
        sb.l();
        sb.exp(this.exp);
        if (this.isBoolean === true)
            sb.append(' in boolean mode ');
        sb.r();
    }
}
exports.ExpMatch = ExpMatch;
ExpVal.num0 = new ExpNum(0);
ExpVal.num1 = new ExpNum(1);
ExpVal.num_1 = new ExpNum(-1);
ExpVal.num2 = new ExpNum(2);
ExpVal.num3 = new ExpNum(3);
ExpVal.null = new ExpNull();
//# sourceMappingURL=exps.js.map