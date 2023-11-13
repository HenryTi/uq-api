import { BizBud, BizExp, BizExpParamType, BizFieldOperand, BizPhraseType, BizTitle, BudDataType, EnumSysTable } from "../../il";
// import { BBizField } from "../Biz";
// import { BBizField } from "../Biz";
import { DbContext } from "../dbContext";
import { ExpInterval, ExpVal } from "./exp";
import { SqlBuilder } from "./sqlBuilder";

let bizEpxTblNo = 0;

export class BBizExp {
    readonly ta: string;
    readonly tb: string;
    readonly tt: string;

    db: string;
    bizExp: BizExp;
    param: ExpVal;
    inVal: ExpVal;

    constructor() {
        ++bizEpxTblNo;
        this.ta = '$a' + bizEpxTblNo;
        this.tb = '$b' + bizEpxTblNo;
        this.tt = '$t' + bizEpxTblNo;
    }

    to(sb: SqlBuilder): void {
        sb.l();
        sb.append('SELECT ');
        const { bizPhraseType } = this.bizExp.bizEntity;
        switch (bizPhraseType) {
            default: debugger; throw new Error(`not implemented bizPhraseType ${this.bizExp.bizEntity}`);
            case BizPhraseType.atom: this.atom(sb); break;
            case BizPhraseType.spec: this.spec(sb); break;
            case BizPhraseType.bin: this.bin(sb); break;
            case BizPhraseType.title: this.title(sb); break;
        }
        sb.r();
    }
    convertFrom(context: DbContext, bizExp: BizExp) {
        this.db = context.dbName;
        this.bizExp = bizExp;
        const { param } = bizExp.param;
        this.param = context.expVal(param);
        const { in: inVar } = bizExp;
        if (inVar !== undefined) {
            const { val: inVal, spanPeiod } = inVar;
            this.inVal = new ExpInterval(spanPeiod, context.expVal(inVal));
        }
    }

    private atom(sb: SqlBuilder) {
        const { bizEntity, prop } = this.bizExp;
        let bud = bizEntity.props.get(prop);
        if (bud === undefined) {
            sb.append(prop);
        }
        else {
            debugger;
        }

        sb.append(' FROM ').dbName().append('.`atom` WHERE id=');
        sb.exp(this.param);
        sb.append(' AND base=');
        sb.append(bizEntity.id);
    }

    private spec(sb: SqlBuilder) {

    }

    private bin(sb: SqlBuilder) {
        const { bizEntity, prop } = this.bizExp;
        const { ta, tb } = this;
        sb.append(`${ta}.${prop ?? 'id'}
        FROM ${this.db}.bin as ${ta} JOIN ${this.db}.bud as ${tb} ON ${tb}.id=${ta}.id AND ${tb}.ext=${bizEntity.id} 
            WHERE ${ta}.id=`)
            .exp(this.param);
    }

    private title(sb: SqlBuilder) {
        const { prop, in: inVar, param: { paramType } } = this.bizExp;
        if (inVar === undefined || prop === 'value') {
            let titleValue: TitleValueBase;
            switch (paramType) {
                case BizExpParamType.scalar:
                    titleValue = new TitleValue(sb, this);
                    break;
                case BizExpParamType.spec:
                    titleValue = new TitleSpecSum(sb, this);
                    break;
                case BizExpParamType.ix:
                    titleValue = new TitleIxSum(sb, this);
                    break;
            }
            titleValue.sql();
        }
        else {
            let titleHistory: TitleHistoryBase;
            switch (paramType) {
                case BizExpParamType.scalar:
                    titleHistory = new TitleHistory(sb, this);
                    break;
                case BizExpParamType.spec:
                    titleHistory = new TitleSpecHistory(sb, this);
                    break;
                case BizExpParamType.ix:
                    titleHistory = new TitleIxHistory(sb, this);
                    break;
            }
            titleHistory.sql();
        }
    }
}

abstract class TitleExpBase {
    protected readonly sb: SqlBuilder;
    protected readonly bBizExp: BBizExp;
    constructor(sb: SqlBuilder, bBizExp: BBizExp) {
        this.sb = sb;
        this.bBizExp = bBizExp;
    }
    abstract sql(): void;
}

abstract class TitleValueBase extends TitleExpBase {
    protected ixBudTbl() {
        const { bud } = this.bBizExp.bizExp;
        let ixBudTbl: string;
        switch (bud.dataType) {
            default: ixBudTbl = 'ixbudint'; break;
            case BudDataType.dec: ixBudTbl = 'ixbuddec'; break;
        }
        return ixBudTbl;
    }
}

class TitleValue extends TitleValueBase {
    override sql() {
        const { bizExp, ta, db, param } = this.bBizExp;
        const { bud } = bizExp;
        let tblBudValue = this.ixBudTbl();
        this.sb.append(`${ta}.value FROM ${db}.${tblBudValue} as ${ta} WHERE ${ta}.i=`);
        this.sb.exp(param);
        this.sb.append(` AND ${ta}.x=${bud.id}`);
    }
}

abstract class TitleSum extends TitleValueBase {
    abstract from(): void;
    override sql(): void {
        const { bizExp, ta, tt, db, inVal, param } = this.bBizExp;
        const { bud, prop, in: ilInVar } = bizExp;
        const { sb } = this;
        sb.append(`sum(${ta}.value) `);
        this.from();
        sb.exp(param);
        sb.append(` AND ${ta}.x=${bud.id}`);
    }
}

class TitleSpecSum extends TitleSum {
    override from() {
        const { bizExp, ta, tt, db, inVal, param } = this.bBizExp;
        //this.titleValueSum(sb, 'spec', 'id', 'base');
        let tblBudValue = this.ixBudTbl();
        this.sb.append(`
        FROM ${db}.spec as ${tt}
        JOIN ${db}.${tblBudValue} as ${ta} ON ${ta}.i=${tt}.id
    WHERE ${tt}.base=`);

    }
}

class TitleIxSum extends TitleSum {
    override from() {
        const { bizExp, ta, tt, db, inVal, param } = this.bBizExp;
        // this.titleValueSum(sb, 'ixbud', 'x', 'i');
        let tblBudValue = this.ixBudTbl();
        this.sb.append(`
        FROM ${db}.ixbud as ${tt}
        JOIN ${db}.${tblBudValue} as ${ta} ON ${ta}.i=${tt}.x
    WHERE ${tt}.i=`);

    }
}

abstract class TitleHistoryBase extends TitleExpBase {
    override sql() {
        const { bizExp, ta, db, inVal } = this.bBizExp;
        const { bud, prop, in: ilInVar } = bizExp;
        const { varTimeSpan: timeSpan, op, statementNo } = ilInVar;
        this.sb.append(`${prop}(${ta}.value) FROM ${db}.history as ${ta} `);
        this.from();
        this.sb.append(`${ta}.id>=_${timeSpan}_${statementNo}$start`);
        if (op !== undefined) {
            this.sb.append(op).exp(inVal);
        }
        this.sb.append(` AND ${ta}.id<_${timeSpan}_${statementNo}$end`);
        if (op !== undefined) {
            this.sb.append(op).exp(inVal);
        }
    }
    abstract from(): void;
}

class TitleHistory extends TitleHistoryBase {
    from() {
        const { bizExp, ta, db, param } = this.bBizExp;
        const { bud } = bizExp;
        this.sb.append(`
WHERE ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, `).exp(param)
            ;
        this.sb.append(`,${bud.id}) AND `);
    }
}

class TitleSpecHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, param } = this.bBizExp;
        const { bud } = bizExp;
        this.sb.append(`JOIN ${db}.spec as ${tt} ON ${tt}.base=`).exp(param)
            .append(` AND ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, ${tt}.id, ${bud.id}) WHERE `);
    }
}

class TitleIxHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, param } = this.bBizExp;
        const { bud } = bizExp;
        this.sb.append(`JOIN ${db}.ixbud as ${tt} ON ${tt}.i=`).exp(param)
            .append(` AND ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, ${tt}.x, ${bud.id}) WHERE `);
    }
}

export class BBizFieldOperand extends ExpVal {
    private readonly bBizField: any; // BBizField;
    constructor(bBizField: any) { // BBizField) {
        super();
        this.bBizField = bBizField;
    }

    to(sb: SqlBuilder): void {
        this.bBizField.to(sb);
    }
}
