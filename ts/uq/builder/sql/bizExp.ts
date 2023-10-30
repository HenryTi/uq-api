import { BizBud, BizExp, BizFieldOperand, BizPhraseType, BizTitle, BudDataType, EnumSysTable } from "../../il";
import { DbContext } from "../dbContext";
import { ExpInterval, ExpVal } from "./exp";
import { SqlBuilder } from "./sqlBuilder";

let bizEpxTblNo = 0;

export class BBizExp {
    private readonly ta: string;
    private readonly tb: string;

    db: string;
    bizExp: BizExp;
    param: ExpVal;
    inVal: ExpVal;

    constructor() {
        ++bizEpxTblNo;
        this.ta = '$a' + bizEpxTblNo;
        this.tb = '$b' + bizEpxTblNo;
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
        this.param = context.expVal(bizExp.param);
        const { in: inVar } = bizExp;
        if (inVar !== undefined) {
            const { val: inVal, spanPeiod } = inVar;
            this.inVal = new ExpInterval(spanPeiod, context.expVal(inVal));
        }
    }

    private atom(sb: SqlBuilder) {
        const { bizEntity, prop } = this.bizExp;
        let bud = bizEntity.props.get(prop);
        sb.append(' FROM atom WHERE id=');
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
        const { bizEntity, bud, prop, in: inVar } = this.bizExp;
        const title = bizEntity as BizTitle;
        let tblBudValue: string;
        switch (bud.dataType) {
            default: tblBudValue = 'ixbudint'; break;
            case BudDataType.dec: tblBudValue = 'ixbuddec'; break;
        }
        const { ta } = this;
        if (inVar === undefined || prop === 'value') {
            sb.append(`${ta}.value FROM ${this.db}.${tblBudValue} as ${ta} WHERE ${ta}.i=`);
            sb.exp(this.param);
            sb.append(` AND ${ta}.x=${bud.id}`);
        }
        else {
            const { varTimeSpan: timeSpan, op, statementNo } = inVar;
            sb.append(`${prop}(${ta}.value) FROM ${this.db}.history as ${ta} 
        WHERE ${ta}.bud=${this.db}.bud$id(_$site,_$user, 0, null, `).exp(this.param).append(`,${bud.id})
            AND ${ta}.id>=_${timeSpan}_${statementNo}$start`);
            if (op !== undefined) {
                sb.append(op).exp(this.inVal);
            }
            sb.append(` AND ${ta}.id<_${timeSpan}_${statementNo}$end`);
            if (op !== undefined) {
                sb.append(op).exp(this.inVal);
            }
        }
    }
}

export class BBizFieldOperand extends ExpVal {
    private readonly bizField: BizFieldOperand;
    constructor(bizField: BizFieldOperand) {
        super();
        this.bizField = bizField;
    }

    to(sb: SqlBuilder): void {
        const { bizBud, fieldName } = this.bizField;
        if (fieldName) {
            sb.append('t1.').append(fieldName);
        }
        else {
            function buildSelectValue(tbl: EnumSysTable) {
                sb.l().append('select value from ').dbName().dot().append(tbl)
                    .append(' where i=t1.id and x=').append(bizBud.id)
                    .r();
            }
            function buildSelectMulti() {
                sb.l().append('select JSON_ARRAYAGG(x1.ext) from ')
                    .dbName().dot().append(EnumSysTable.ixBud).append(' AS x0 JOIN ')
                    .dbName().dot().append(EnumSysTable.bud).append(' AS x1 ON x1.id=x0.x ')
                    .append(' where x0.i=t1.id AND x1.base=').append(bizBud.id)
                    .r();
            }
            switch (bizBud.dataType) {
                default:
                    buildSelectValue(EnumSysTable.ixBudInt);
                    return;
                case BudDataType.str:
                case BudDataType.char:
                    buildSelectValue(EnumSysTable.ixBudStr);
                    return;
                case BudDataType.dec:
                    buildSelectValue(EnumSysTable.ixBudDec);
                    return;
                case BudDataType.radio:
                case BudDataType.check:
                    buildSelectMulti();
                    return;
            }
        }
    }
}
