import {
    BizExp, BizExpParamType, BizField, BizPhraseType, BudDataType, OptionsItem
} from "../../il";
import { ExpVal, ExpInterval } from "../sql/exp";
import { DbContext } from "../dbContext";
import { SqlBuilder } from "../sql/sqlBuilder";
import { BBudSelect } from "./BBudSelect";
import { BBizField } from "../Biz";

let bizEpxTblNo = 0;

export class BBizExp {
    readonly ta: string;
    readonly tb: string;
    readonly tt: string;

    db: string;
    bizExp: BizExp;
    param: ExpVal;
    param2: ExpVal;
    inVal: ExpVal;
    expSelect: ExpVal;

    constructor() {
        ++bizEpxTblNo;
        this.ta = '$a' + bizEpxTblNo;
        this.tb = '$b' + bizEpxTblNo;
        this.tt = '$t' + bizEpxTblNo;
    }

    to(sb: SqlBuilder): void {
        sb.l();
        if (this.expSelect !== undefined) {
            sb.exp(this.expSelect);
        }
        else {
            sb.append('SELECT ');
            const { bizPhraseType } = this.bizExp.bizEntity;
            switch (bizPhraseType) {
                default: debugger; throw new Error(`not implemented bizPhraseType ${this.bizExp.bizEntity}`);
                // case BizPhraseType.atom: this.atom(sb); break;
                // case BizPhraseType.spec: this.spec(sb); break;
                case BizPhraseType.bin: this.bin(sb); break;
                case BizPhraseType.title: this.title(sb); break;
                case BizPhraseType.tie: this.tie(sb); break;
                case BizPhraseType.duo: this.duo(sb); break;
            }
        }
        sb.r();
    }
    convertFrom(context: DbContext, bizExp: BizExp) {
        this.db = context.dbName;
        this.bizExp = bizExp;
        if (bizExp === undefined) return;
        const { param, param2 } = bizExp.param;
        this.param = context.expVal(param);
        this.param2 = context.expVal(param2);
        const { in: inVar } = bizExp;
        if (inVar !== undefined) {
            const { val: inVal, spanPeiod } = inVar;
            this.inVal = new ExpInterval(spanPeiod, context.expVal(inVal));
        }
        const { bizPhraseType } = this.bizExp.bizEntity;
        switch (bizPhraseType) {
            case BizPhraseType.atom:
            case BizPhraseType.spec:
                let bBudSelect = new BBudSelect(context, this);
                this.expSelect = bBudSelect.build();
                break;
        }
    }
    /*
    private atom(sb: SqlBuilder) {
        const { bizEntity, prop, budProp } = this.bizExp;
        // let bud = bizEntity.props.get(prop);
        if (budProp === undefined) {
            sb.append(prop);
            sb.append(' FROM ').dbName().append('.`atom` WHERE id=');
            sb.exp(this.param);
            sb.append(' AND base=');
            sb.append(bizEntity.id);
        }
        else {
            // let partBuilder = new PartBuilderSelectBud(budProp, bizEntity, this.param);
            //sb.part(partBuilder);
        }
    }

    private spec(sb: SqlBuilder) {
    }
    */
    private bin(sb: SqlBuilder) {
        const { bizEntity, prop } = this.bizExp;
        const { ta, tb } = this;
        sb.append(`${ta}.${prop ?? 'id'}
        FROM ${this.db}.bin as ${ta} JOIN ${this.db}.bud as ${tb} ON ${tb}.id=${ta}.id AND ${tb}.ext=${bizEntity.id} 
            WHERE ${ta}.id=`)
            .exp(this.param);
    }

    private tie(sb: SqlBuilder) {
        const { bizEntity } = this.bizExp;
        const { ta, tb } = this;
        sb.append(`${ta}.x
        FROM ${this.db}.ixbud as ${ta} JOIN ${this.db}.bud as ${tb} ON ${tb}.id=${ta}.i AND ${tb}.base=${bizEntity.id} 
            WHERE ${tb}.ext=`)
            .exp(this.param);
    }

    private duo(sb: SqlBuilder) {
        const { bizEntity, prop } = this.bizExp;
        const { ta } = this;
        if (this.param2 !== undefined) {
            sb.append(`${this.db}.duo$id(_$site,_$user,1,null,`).exp(this.param).comma().exp(this.param2).r();
        }
        else {
            sb.append(`${ta}.${prop} FROM ${this.db}.duo as ${ta} WHERE ${ta}.id=`)
                .exp(this.param);
        }
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
        const { budEntitySub: bud } = this.bBizExp.bizExp;
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
        const { budEntitySub: bud } = bizExp;
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
        const { budEntitySub: bud, prop, in: ilInVar } = bizExp;
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
        const { budEntitySub: bud, prop, in: ilInVar } = bizExp;
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
        const { budEntitySub: bud } = bizExp;
        this.sb.append(`
WHERE ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, `).exp(param)
            ;
        this.sb.append(`,${bud.id}) AND `);
    }
}

class TitleSpecHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, param } = this.bBizExp;
        const { budEntitySub: bud } = bizExp;
        this.sb.append(`JOIN ${db}.spec as ${tt} ON ${tt}.base=`).exp(param)
            .append(` AND ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, ${tt}.id, ${bud.id}) WHERE `);
    }
}

class TitleIxHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, param } = this.bBizExp;
        const { budEntitySub: bud } = bizExp;
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

export class BBizCheckBud extends ExpVal {
    private readonly expOptionId: ExpVal;
    private readonly bExp1: BBizExp;
    private readonly bExp2: BBizExp;
    private readonly bizField: BBizField<BizField>;
    private readonly items: OptionsItem[];
    constructor(expOptionId: ExpVal, bExp1: BBizExp, bExp2: BBizExp, bizField: BBizField<BizField>, items: OptionsItem[]) {
        super();
        this.expOptionId = expOptionId;
        this.bExp1 = bExp1;
        this.bExp2 = bExp2;
        this.bizField = bizField;
        this.items = items;
    }
    to(sb: SqlBuilder): void {
        let t = '$check';
        if (this.expOptionId !== undefined) {
            sb.exp(this.expOptionId)
            this.buildIn(sb);
        }
        else {
            sb.append('EXISTS(SELECT ').append(t).dot().append('id FROM ');
            if (this.bExp1 !== undefined) {
                sb.l();
                this.bExp1.to(sb);
                sb.r();
            }
            else {
                this.buildValExp(sb);
            }
            sb.append(' AS ').append(t)
                .append(' WHERE ').append(t).dot().alias('id ');
            this.buildIn(sb);
            sb.r();
        }
    }

    private buildIn(sb: SqlBuilder) {
        sb.append(' IN (');
        if (this.items !== undefined) {
            sb.append(this.items.map(v => v.id).join(','));
        }
        else {
            this.bExp2.to(sb);
        }
        sb.r();
    }

    private buildValExp(sb: SqlBuilder) {
        // sb.append('JSON_TABLE(');
        this.bizField.to(sb);
        // sb.append(`,'$[*]' COLUMNS(id INT PATH '$')`);
    }
}
/*
mysql：
SELECT EXISTS(
    SELECT a.c
        FROM (SELECT c
        FROM
            JSON_TABLE('[1, 2]', '$[*]' COLUMNS(c INT PATH '$')) as jt
        ) AS a
        WHERE a.c IN (SELECT c
        FROM
            JSON_TABLE('[1, 2, 3, 4]', '$[*]' COLUMNS(c INT PATH '$')) as jt)
    ) AS b;

bzscript 源码
    CHECK (#zz(%id).dd) ON (#bb(%id).ee)
    CHECK (#zz(%id).dd) = OPTIONS.a)
    CHECK %field = OPTIONS.a
    -- CHECK %field in (OPTIONS.a, OPTIONS.b) 未实现
*/
