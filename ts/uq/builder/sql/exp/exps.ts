import { SqlBuilder, unitFieldName } from '../sqlBuilder';
import { Select as SqlSelect } from '../select';
import { EntityTable } from '../statementWithFrom';
import { Field } from '../../../il/field';
import { TuidArr, Entity, DataType, BizBase, SpanPeriod, EnumSysTable } from '../../../il';
import { Exp } from './Exp';
import { sysTable } from '../../dbContext';

export abstract class ExpVal extends Exp {
    static num0: ExpVal;
    static num1: ExpVal;
    static num2: ExpVal;
    static num3: ExpVal;
    static null: ExpVal;
    static num_1: ExpVal;

    brace: boolean = false;
    protected val: ExpVal;
}

export abstract class ExpCmp extends Exp {
    get voided(): boolean { return false; }
}

abstract class Exp1Cmp extends ExpCmp {
    protected opd: ExpCmp;
    get voided(): boolean { return this.opd.voided; }
    constructor(opd: ExpCmp) { super(); this.opd = opd; }
}
export class ExpNot extends Exp1Cmp {
    to(sb: SqlBuilder) {
        if (this.opd.voided === true) return;
        sb.append('NOT ').l().exp(this.opd).r();
    }
}

abstract class ExpCmps extends ExpCmp {
    protected opds: ExpCmp[] = [];
    get voided(): boolean { for (let opd of this.opds) if (opd.voided === true) return true; return false; }
    protected abstract get op(): string;
    protected abstract get placeHolder(): string;
    to(sb: SqlBuilder) {
        if (this.opds.length === 0) {
            sb.space();
            sb.append(this.placeHolder);
            return;
        }
        let i = 0, len = this.opds.length;
        for (; i < len; i++) {
            let opd = this.opds[i];
            if (opd === undefined) continue;
            if (opd.voided === false) {
                opd.to(sb);
                ++i;
                break;
            }
        }
        for (; i < len; i++) {
            let opd = this.opds[i];
            if (opd === undefined) continue;
            if (opd.voided === true) continue;
            sb.append(this.op);
            opd.to(sb);
        }
    }
    constructor(...opds: ExpCmp[]) { super(); this.opds = opds; }
}
export class ExpAnd extends ExpCmps {
    protected get op(): string { return ' AND ' }
    protected get placeHolder(): string { return '1=1' }
}
export class ExpOr extends ExpCmps {
    to(sb: SqlBuilder) {
        sb.l();
        super.to(sb);
        sb.r();
    }
    protected get op(): string { return ' OR ' }
    protected get placeHolder(): string { return '1=0' }
}

export class ExpAt extends ExpVal {
    readonly biz: BizBase;
    readonly item: ExpVal;
    readonly bizName: string[];
    readonly bizVal: ExpVal;
    to(sb: SqlBuilder) {
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
    constructor(biz: BizBase, item: ExpVal, bizName: string[], bizVal: ExpVal) {
        super();
        this.biz = biz;
        this.item = item;
        this.bizName = bizName;
        this.bizVal = bizVal;
    }
}
export class ExpStr extends ExpVal {
    value: string;
    to(sb: SqlBuilder) { sb.append('\'').append(this.value).append('\''); }
    constructor(value: string) { super(); this.value = value; }
}
export class ExpNum extends ExpVal {
    num: number;
    to(sb: SqlBuilder) { sb.append(this.num.toString()); }
    constructor(num: number) { super(); this.num = num; }
}
export class ExpStar extends ExpVal {
    to(sb: SqlBuilder) {
        sb.append('*');
    }
}
export class ExpHex extends ExpVal {
    value: string;
    to(sb: SqlBuilder) { sb.append(this.value); }
    constructor(value: string) { super(); this.value = value; }
}
export class ExpField extends ExpVal {
    tbl: string; // 表别名
    name: string; // 字段名
    collate: string;
    to(sb: SqlBuilder) {
        if (sb.fieldValue0 === true) {
            sb.append('0');
        }
        else {
            sb.aliasDot(this.tbl).fld(this.name).collate(this.collate);
        }
    }
    constructor(name: string, tbl?: string, collate?: string) {
        super();
        this.tbl = tbl;
        this.name = name;
        this.collate = collate;
    }
}
export class ExpParam extends ExpVal {
    private name: string;       // 参数名
    to(sb: SqlBuilder) {
        sb.param(this.name);
    }
    constructor(name: string) { super(); this.name = name; }
}
export class ExpVar extends ExpVal {
    private name: string;       // proc定义的变量名
    private collate: string;
    to(sb: SqlBuilder) {
        sb.var(this.name).collate(this.collate);
    }
    constructor(name: string, collate?: string) {
        super();
        this.name = name;
        this.collate = collate;
    }
}
export class ExpAtEQ extends ExpVal {
    private name: string;
    private expVal: ExpVal;
    to(sb: SqlBuilder) {
        sb.l().append('@').append(this.name).append(':=').exp(this.expVal).r();
    }
    constructor(name: string, expVal: ExpVal) {
        super();
        this.name = name;
        this.expVal = expVal;
    }
}
export class ExpNeg extends ExpVal {
    val: ExpVal;
    to(sb: SqlBuilder) { sb.append('-('); this.val.to(sb); sb.r(); }
    constructor(val: ExpVal) { super(); this.val = val; }
}
export class ExpParenthese extends ExpVal {
    val: ExpVal;
    to(sb: SqlBuilder) { sb.l(); this.val.to(sb); sb.r(); }
    constructor(val: ExpVal) { super(); this.val = val; }
}
export class ExpBitInvert extends ExpVal {
    val: ExpVal;
    to(sb: SqlBuilder) { sb.append('~('); this.val.to(sb); sb.r(); }
    constructor(val: ExpVal) { super(); this.val = val; }
}
abstract class ExpVals extends ExpVal {
    private vals: ExpVal[];
    protected abstract get op(): string;
    to(sb: SqlBuilder) {

        sb.sepStart(this.op);
        for (let v of this.vals) {
            sb.sep();
            let b = v.brace;
            if (b === true) sb.l();
            sb.exp(v);
            if (b === true) sb.r();
        }
        sb.sepEnd();
    }
    constructor(...vals: ExpVal[]) { super(); this.vals = vals; }
}
export class ExpAdd extends ExpVals {
    brace: boolean = true;
    protected get op(): string { return '+'; }
}
export class ExpSub extends ExpVals {
    brace: boolean = true;
    protected get op(): string { return '-'; }
}
export class ExpMul extends ExpVals {
    get op(): string { return '*'; }
}
export class ExpDiv extends ExpVals {
    get op(): string { return ' DIV '; }
}
export class ExpDecDiv extends ExpVals {
    get op(): string { return '/'; }
}
export class ExpMod extends ExpVals {
    get op(): string { return '%'; }
}
export class ExpJsonProp extends ExpVals {
    get op(): string { return '->>'; }
}
export class ExpBitAnd extends ExpVals {
    get op(): string { return '&'; }
}
export class ExpBitOr extends ExpVals {
    get op(): string { return '|'; }
}
export class ExpBitRight extends ExpVals {
    brace: boolean = true;
    get op(): string { return '>>'; }
}
export class ExpBitLeft extends ExpVals {
    brace: boolean = true;
    get op(): string { return '<<'; }
}

export class ExpDatePart extends ExpVal {
    private part: string;
    constructor(part: string) {
        super();
        this.part = part;
    }
    to(sb: SqlBuilder) { sb.append(this.part) }
}
export class ExpIsNull extends ExpCmp {
    private opd: ExpVal;
    to(sb: SqlBuilder) { sb.exp(this.opd).append(' IS NULL'); }
    constructor(opd: ExpVal) { super(); this.opd = opd; }
}
export class ExpIsNotNull extends ExpCmp {
    private opd: ExpVal;
    to(sb: SqlBuilder) { sb.exp(this.opd).append(' IS NOT NULL'); }
    constructor(opd: ExpVal) { super(); this.opd = opd; }
}
export class ExpIn extends ExpCmp {
    private exps: ExpVal[];
    to(sb: SqlBuilder) {
        sb.exp(this.exps[0]);
        sb.append(' IN ').l();
        let len = this.exps.length;
        sb.sepStart(',');
        for (let i = 1; i < len; i++) sb.sep().exp(this.exps[i]);
        sb.sepEnd();
        sb.r();
    }
    constructor(...exps: ExpVal[]) { super(); this.exps = exps }
}
export class ExpUnitCmp extends ExpCmp {
    private alias: string;
    private unit: Field;
    constructor(unit: Field, alias?: string) {
        super();
        this.unit = unit;
        this.alias = alias;
    }
    get voided(): boolean { return this.unit === undefined; }
    to(sb: SqlBuilder) {
        if (this.unit === undefined) return;
        sb.aliasDot(this.alias).fld(this.unit.name).append('=').param(unitFieldName);
    }
}
export abstract class Exp2Cmp extends ExpCmp {
    private op1: ExpVal;
    private op2: ExpVal;
    to(sb: SqlBuilder) {
        sb.exp(this.op1).append(this.op).exp(this.op2);
    }
    constructor(op1: ExpVal, op2: ExpVal) { super(); this.op1 = op1; this.op2 = op2; }
    abstract get op(): string;
}
export class ExpLike extends Exp2Cmp {
    get op(): string { return ' LIKE '; }
}
export class ExpEQ extends Exp2Cmp {
    get op(): string { return '='; }
}
export class ExpEQBinary extends Exp2Cmp {
    get op(): string { return '='; }
    to(sb: SqlBuilder) {
        sb.append('binary').space();
        super.to(sb);
    }
}
export class ExpGT extends Exp2Cmp {
    get op(): string { return '>'; }
}
export class ExpLT extends Exp2Cmp {
    get op(): string { return '<'; }
}
export class ExpGE extends Exp2Cmp {
    get op(): string { return '>='; }
}
export class ExpLE extends Exp2Cmp {
    get op(): string { return '<='; }
}
export class ExpNE extends Exp2Cmp {
    get op(): string { return '<>'; }
}
export class ExpFunc extends ExpVal {
    private readonly fName: string;
    private readonly params: Exp[];
    constructor(funcName: string, ...params: Exp[]) {
        super();
        if (!funcName) debugger;
        this.fName = funcName;
        this.params = params;
    }
    to(sb: SqlBuilder) {
        sb.func(this.fName, this.params, false);
    }
}
export class ExpFuncDb extends ExpFunc {
    private db: string;
    constructor(db: string, funcName: string, ...params: ExpVal[]) {
        super(funcName, ...params);
        this.db = db;
    }
    to(sb: SqlBuilder) {
        sb.name(this.db).dot();
        super.to(sb);
    }
}
export class ExpFuncCustom extends ExpVal {
    private func: (sb: SqlBuilder, params: ExpVal[]) => void;
    private params: ExpVal[];
    constructor(func: (sb: SqlBuilder, params: ExpVal[]) => void, ...params: ExpVal[]) {
        super();
        this.func = func;
        this.params = params;
    }
    to(sb: SqlBuilder) {
        this.func(sb, this.params);
    }
}

export class ExpSearchCase extends ExpVal {
    private exps: Exp[];
    private expElse: Exp;

    constructor(exps: Exp[], expElse: Exp) {
        super();
        this.exps = exps;
        this.expElse = expElse;
    }
    to(sb: SqlBuilder) {
        sb.append('CASE');
        let len = this.exps.length;
        for (let i = 0; i < len;) {
            sb.append(' WHEN ');
            sb.exp(this.exps[i++]);
            sb.append(' THEN ')
            sb.exp(this.exps[i++]);
        }
        if (this.expElse !== undefined) {
            sb.append(' ELSE ');
            sb.exp(this.expElse);
        }
        sb.append(' END');
    }
}

export class ExpSimpleCase extends ExpVal {
    private expVal: Exp;
    private exps: Exp[];
    private expElse: Exp;

    constructor(expVal: Exp, exps: Exp[], expElse: Exp) {
        super();
        this.expVal = expVal;
        this.exps = exps;
        this.expElse = expElse;
    }
    to(sb: SqlBuilder) {
        sb.append('CASE ');
        sb.exp(this.expVal);
        let len = this.exps.length;
        for (let i = 0; i < len;) {
            sb.append(' WHEN ');
            sb.exp(this.exps[i++]);
            sb.append(' THEN ')
            sb.exp(this.exps[i++]);
        }
        if (this.expElse !== undefined) {
            sb.append(' ELSE ');
            sb.exp(this.expElse);
        }
        sb.append(' END');
    }
}

export class ExpCast extends ExpVal {
    private readonly param: ExpVal;
    private readonly dataType: DataType;
    constructor(param: ExpVal, dataType: DataType) {
        super();
        this.param = param;
        this.dataType = dataType;
    }
    to(sb: SqlBuilder) {
        sb.append('CAST').l();
        sb.exp(this.param).append(' AS ');
        this.dataType.sql(sb);
        sb.r();
    }
}

export class ExpFuncInUq extends ExpVal {
    private func: string;
    private params: ExpVal[];
    private readonly isUqFunc: boolean;
    constructor(func: string, params: ExpVal[], isUqFunc: boolean) {
        super();
        this.func = func;
        this.params = params;
        this.isUqFunc = isUqFunc;
    }
    to(sb: SqlBuilder) {
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
export class ExpSelect extends ExpVal {
    private select: SqlSelect;
    constructor(select: SqlSelect) {
        super();
        this.select = select;
    }
    to(sb: SqlBuilder) {
        sb.l();
        this.select.to(sb, 0);
        sb.r();
    }
}
export class ExpAtVar extends ExpVal {
    private name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    to(sb: SqlBuilder) {
        sb.append('@').append(this.name);
    }
}
export class ExpDollarVar extends ExpVal {
    private name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    to(sb: SqlBuilder) {
        sb.var('$' + this.name);
    }
}
export class ExpExists extends ExpCmp {
    private select: SqlSelect;
    constructor(select: SqlSelect) {
        super();
        this.select = select;
    }
    to(sb: SqlBuilder) {
        sb.exists(this.select);
    }
}
export class ExpOf extends Exp {
    private val: ExpVal;
    private tuidArr: TuidArr;
    constructor(val: ExpVal, tuidArr: TuidArr) {
        super();
        this.val = val;
        this.tuidArr = tuidArr;
    }
    to(sb: SqlBuilder) {
        sb.l();
        let select = sb.factory.createSelect();
        // tuid arr 表没有unit
        let hasUnit: boolean = false;
        select.col('$owner');
        select.from(new EntityTable(this.tuidArr.getTableName(), hasUnit));
        select.where(new ExpEQ(new ExpField(this.tuidArr.id.name), this.val as ExpVal));
        select.to(sb, 0);
        sb.r();
    }
}
export class ExpTypeof extends Exp {
    private entity: Entity;
    private val: ExpVal;
    constructor(entity: Entity, val: ExpVal) {
        super();
        this.entity = entity;
        this.val = val;
    }
    to(sb: SqlBuilder) {
        sb.l();
        let select = sb.factory.createSelect();
        // tuid arr 表没有unit
        let hasUnit: boolean = false;
        select.col('id');
        select.from(sysTable(EnumSysTable.entity));
        select.where(new ExpEQ(
            new ExpField('name'),
            this.entity ? new ExpStr(this.entity.name) : this.val));
        select.to(sb, 0);
        sb.r();
    }
}
export class ExpNameof extends Exp {
    private entity: Entity;
    constructor(entity: Entity) {
        super();
        this.entity = entity;
    }
    to(sb: SqlBuilder) {
        sb.l();
        sb.string(this.entity.name);
        sb.r();
    }
}

export class ExpEntityId extends Exp {
    private val: ExpVal;
    constructor(val: ExpVal) {
        super();
        this.val = val;
    }
    to(sb: SqlBuilder) {
        sb.l().append('select entity from ')
            .dbName().dot().entityTableName(EnumSysTable.id_u)
            .append(' where id=').exp(this.val).r();
    }
}

export class ExpEntityName extends Exp {
    private val: ExpVal;
    constructor(val: ExpVal) {
        super();
        this.val = val;
    }
    to(sb: SqlBuilder) {
        sb.l().append('select b.name from ')
            .dbName().dot().entityTableName(EnumSysTable.id_u)
            .append(' as a join ').entityTableName('$entity')
            .append(' as b ON a.entity=b.id where a.id=').exp(this.val).r();
    }
}

export class ExpKey extends ExpVal {
    private key: string;
    constructor(key: string) {
        super();
        this.key = key;
    }
    to(sb: SqlBuilder) {
        sb.key(this.key);
    }
}

export class ExpNull extends ExpVal {
    to(sb: SqlBuilder) {
        sb.append('NULL');
    }
}

export class ExpMatch extends ExpCmp {
    private varOperands: Exp[];
    private isBoolean: boolean;
    private exp: Exp;
    constructor(varOperands: Exp[], exp: Exp, isBoolean: boolean) {
        super();
        this.varOperands = varOperands;
        this.exp = exp;
        this.isBoolean = isBoolean;
    }
    to(sb: SqlBuilder) {
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
        if (this.isBoolean === true) sb.append(' in boolean mode ');
        sb.r();
    }
}

export class ExpInterval extends ExpVal {
    private readonly spanPeriod: SpanPeriod;
    private readonly value: ExpVal;
    constructor(spanPeriod: SpanPeriod, value: ExpVal) {
        super();
        this.spanPeriod = spanPeriod;
        this.value = value;
    }
    to(sb: SqlBuilder) {
        sb.append('INTERVAL ').exp(this.value).space()
            .append(SpanPeriod[this.spanPeriod]);
    }
}

ExpVal.num0 = new ExpNum(0);
ExpVal.num1 = new ExpNum(1);
ExpVal.num_1 = new ExpNum(-1);
ExpVal.num2 = new ExpNum(2);
ExpVal.num3 = new ExpNum(3);
ExpVal.null = new ExpNull();
