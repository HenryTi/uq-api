import {
    BizExp, BizExpParamType, BizField, EnumSysBud, EnumSysTable, OptionsItem
} from "../../il";
import { ExpVal, ExpInterval } from "../sql/exp";
import { DbContext } from "../dbContext";
import { SqlBuilder } from "../sql/sqlBuilder";
import { BBudSelect } from "./BBudSelect";
import { BBizField } from "../Biz";
import { BizPhraseType, BudDataType } from "../../il/Biz/BizPhraseType";
import { $site } from "../consts";

let bizEpxTblNo = 0;

export class BBizExp {
    readonly ta: string;
    readonly tb: string;
    readonly tt: string;

    db: string;
    bizExp: BizExp;
    params: ExpVal[];
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
            const { bizEntity, expIDType } = this.bizExp;
            if (bizEntity !== undefined) {
                const { bizPhraseType } = bizEntity;
                switch (bizPhraseType) {
                    default: debugger; throw new Error(`not implemented bizPhraseType ${this.bizExp.bizEntity}`);
                    case BizPhraseType.bin: this.bin(sb); break;
                    case BizPhraseType.book: this.book(sb); break;
                    case BizPhraseType.tie: this.tie(sb); break;
                    case BizPhraseType.duo: this.duo(sb); break;
                    case BizPhraseType.combo: this.combo(sb); break;
                }
            }
            else {
                switch (expIDType) {
                }
                debugger;
            }
        }
        sb.r();
    }
    convertFrom(context: DbContext, bizExp: BizExp) {
        this.db = context.dbName;
        this.bizExp = bizExp;
        if (bizExp === undefined) return;
        const { param } = bizExp;
        if (param !== undefined) {
            const { params } = param;
            this.params = params.map(v => context.expVal(v));
        }
        const { in: inVar } = bizExp;
        if (inVar !== undefined) {
            const { val: inVal, spanPeiod } = inVar;
            this.inVal = new ExpInterval(spanPeiod, context.expVal(inVal));
        }
        const { bizEntity } = this.bizExp;
        if (bizEntity !== undefined) {
            const { bizPhraseType } = bizEntity;
            switch (bizPhraseType) {
                case BizPhraseType.atom:
                case BizPhraseType.fork:
                    let bBudSelect = new BBudSelect(context, this);
                    this.expSelect = bBudSelect.build();
                    break;
            }
        }
        else {
            let bBudSelect = new BBudSelect(context, this);
            this.expSelect = bBudSelect.build();
        }
    }

    private bin(sb: SqlBuilder) {
        const { budProp, sysBud } = this.bizExp;
        if (sysBud !== undefined) this.binSheetProp(sb);
        else if (budProp !== undefined) this.binBud(sb);
        else this.binField(sb);
    }

    private binSheetProp(sb: SqlBuilder) {
        const { bizEntity, sysBud, isParent } = this.bizExp;
        const { ta, tb, tt } = this;
        const tSheet = 'tsheet';
        let col = tSheet + '.';
        switch (sysBud) {
            case EnumSysBud.id: col += 'id'; break;
            case EnumSysBud.sheetNo: col += 'no'; break;
            case EnumSysBud.sheetOperator: col += 'operator'; break;
        }
        let sql: string;
        sql = `${col} FROM \`${this.db}\`.detail as \`${ta}\` `;
        // let ttBin: string;
        if (isParent === true) {
            sql += `JOIN \`${this.db}\`.bud as \`${tb}\` ON ${tb}.id=${ta}.base AND ${tb}.ext=${bizEntity.id}`;
            /*
            sql = `${col} 
                FROM \`${this.db}\`.detail as ${tt}
                    JOIN \`${this.db}\`.bin as ${ta} ON ${ta}.id=${tt}.base
                    ${joinBud} `;
            */
            // WHERE ${tt}.id=`;
            // ttBin = ta;
        }
        else {
            // sql = `${col} FROM \`${this.db}\`.detail as ${ta} ${joinBud} `;
            // WHERE ${ta}.id=`;
            // ttBin = ta;
        }
        sql += ` JOIN \`${this.db}\`.sheet as ${tSheet} ON ${tSheet}.id=${tb}.base `;
        sql += ` WHERE \`${ta}\`.id = `;
        sb.append(sql);
        sb.exp(this.params[0]);
    }

    private binField(sb: SqlBuilder) {
        const { bizEntity, prop, isParent } = this.bizExp;
        const { ta, tb, tt } = this;
        let col = `${ta}.${prop ?? 'id'} `
        let joinBud = `JOIN ${this.db}.bud as ${tb} ON ${tb}.id = ${ta}.id AND ${tb}.ext = ${bizEntity.id} `;
        let sql: string;
        if (isParent === true) {
            sql = `${col} 
                FROM \`${this.db}\`.detail as ${tt}
                    JOIN \`${this.db}\`.bin as ${ta} ON ${ta}.id=${tt}.base
                    ${joinBud} 
                WHERE ${tt}.id=`;
        }
        else {
            sql = `${col} 
                FROM \`${this.db}\`.detail as ${ta} ${joinBud} 
                WHERE ${ta}.id=`;
        }
        sb.append(sql);
        sb.exp(this.params[0]);
    }

    private binBud(sb: SqlBuilder) {
        const { budProp, isParent } = this.bizExp;
        const { ta, tt } = this;
        let tbl: EnumSysTable;
        switch (budProp.dataType) {
            default: tbl = EnumSysTable.ixBudInt; break;
            case BudDataType.char:
            case BudDataType.str: tbl = EnumSysTable.ixBudStr; break;
            case BudDataType.dec: tbl = EnumSysTable.ixBudDec; break;
            case BudDataType.fork: tbl = EnumSysTable.ixBudJson; break;
        }
        sb.append(`${tt}.value FROM \`${this.db}\`.${tbl} as ${tt}
            WHERE ${tt}.x=${budProp.id} AND ${tt}.i=`);
        if (isParent === true) {
            sb.l();
            sb.append(`SELECT ${ta}.base FROM \`${this.db}\`.detail as ${ta} WHERE `)
            sb.append(ta).dot().append('id=');
            sb.exp(this.params[0]);
            sb.r();
        }
        else {
            sb.exp(this.params[0]);
        }
    }

    private tie(sb: SqlBuilder) {
        const { bizEntity } = this.bizExp;
        const { ta, tb } = this;
        sb.append(`${ta}.x
        FROM ${this.db}.ixbud as ${ta} JOIN ${this.db}.bud as ${tb} ON ${tb}.id=${ta}.i AND ${tb}.base=${bizEntity.id} 
            WHERE ${tb}.ext=`)
            .exp(this.params[0]);
    }

    private duo(sb: SqlBuilder) {
        const { isReadonly, prop } = this.bizExp;
        const { ta } = this;
        let param = this.params[0];
        let param2 = this.params[1];
        if (param2 !== undefined) {
            let w = isReadonly === true ? 0 : 1;
            sb.dbName().dot().name('duo$id').append(`(_$site,_$user,${w},null,`).exp(param).comma().exp(param2).r();
        }
        else {
            sb.append(`${ta}.${prop} FROM ${this.db}.duo as ${ta} WHERE ${ta}.id=`)
                .exp(param);
        }
    }

    private combo(sb: SqlBuilder) {
        const { bizEntity, isReadonly, prop } = this.bizExp;
        const { ta } = this;
        const { site } = sb.factory.dbContext;
        const db = `${$site}.${site}`;
        const siteEntityId = bizEntity.id;
        if (prop !== undefined) {
            sb.append(`${ta}.${prop} FROM `)
                .name(db).dot()
                .name(String(siteEntityId))
                .append(` as ${ta} WHERE ${ta}.id=`)
                .exp(this.params[0]);
        }
        else {
            let w = isReadonly === true ? 0 : 1;
            sb.name(db).dot();
            sb.fld(siteEntityId + '.ID');
            sb.l().append(w);
            for (let p of this.params) {
                sb.comma().exp(p);
            }
            sb.r();
        }
    }

    private book(sb: SqlBuilder) {
        const { prop, in: inVar, param, combo } = this.bizExp;
        if (combo !== undefined) {
            this.bookCombo(sb);
            return;
        }
        const { paramType } = param;
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

    private bookCombo(sb: SqlBuilder) {
        const { budEntitySub, combo, comboParams } = this.bizExp;
        const { dbContext } = sb.factory;
        sb.append('SUM(bcb.value) FROM ')
            .name(`${$site}.${dbContext.site}`).dot().name(`${combo.id}`).append(' AS bca JOIN ')
            .dbName().dot().name(EnumSysTable.ixBudDec)
            .append(` AS bcb ON bcb.x=${budEntitySub.id} AND bcb.i=bca.id WHERE 1=1`);
        const { length } = comboParams;
        const { keys } = combo;
        for (let i = 0; i < length; i++) {
            let cp = comboParams[i];
            if (cp === undefined) continue;
            let ck = keys[i];
            sb.append(' AND bca.').name(String(ck.id)).append('=').exp(dbContext.expVal(cp));
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
            default: ixBudTbl = EnumSysTable.ixBudInt; break;
            case BudDataType.dec: ixBudTbl = EnumSysTable.ixBudDec; break;
        }
        return ixBudTbl;
    }
}

class TitleValue extends TitleValueBase {
    override sql() {
        const { bizExp, ta, db, params: [param] } = this.bBizExp;
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
        const { bizExp, ta, tt, db, inVal, params: [param] } = this.bBizExp;
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
        const { ta, tt, db } = this.bBizExp;
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
        const { ta, tt, db } = this.bBizExp;
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
        const { bizExp, ta, db, params: [param] } = this.bBizExp;
        const { budEntitySub: bud } = bizExp;
        this.sb.append(`
WHERE ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, `).exp(param)
            ;
        this.sb.append(`,${bud.id}) AND `);
    }
}

class TitleSpecHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, params: [param] } = this.bBizExp;
        const { budEntitySub: bud } = bizExp;
        this.sb.append(`JOIN ${db}.spec as ${tt} ON ${tt}.base=`).exp(param)
            .append(` AND ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, ${tt}.id, ${bud.id}) WHERE `);
    }
}

class TitleIxHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, params: [param] } = this.bBizExp;
        const { budEntitySub: bud } = bizExp;
        this.sb.append(`JOIN ${db}.ixbud as ${tt} ON ${tt}.i=`).exp(param)
            .append(` AND ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, ${tt}.x, ${bud.id}) WHERE `);
    }
}

export class BBizFieldOperand extends ExpVal {
    private readonly bBizField: any;
    constructor(bBizField: any) {
        super();
        this.bBizField = bBizField;
    }

    to(sb: SqlBuilder): void {
        if (this.bBizField === undefined) {
            return;
        }
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
            sb.append('EXISTS(SELECT ').append(t).dot().append('value FROM ');
            if (this.bExp1 !== undefined) {
                sb.l();
                this.bExp1.to(sb);
                sb.r();
            }
            else {
                this.buildValExp(sb);
            }
            sb.append(' AS ').append(t)
                .append(' WHERE ').append(t).dot().alias('value ');
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
