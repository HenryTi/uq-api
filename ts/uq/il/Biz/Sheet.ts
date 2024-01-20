import { BBizPend, BBizSheet, DbContext } from "../../builder";
import { PBizPend, PBizQueryTableInPendStatements, PBizSheet, PContext, PElement, PPendQuery } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../IElement";
import { Statements } from "../statement";
import { BizSearch } from "./Base";
import { BizBin } from "./Bin";
import { Biz } from "./Biz";
import { BizPhraseType } from "./BizPhraseType";
import { BizBudValue, BizBudID, BizBudDec, BizBud } from "./Bud";
import { BizEntity } from "./Entity";
import { BizQueryTable } from "./Query";

export class BizSheet extends BizEntity {
    protected readonly fields = ['id', 'no'];
    readonly bizPhraseType = BizPhraseType.sheet;
    main: BizBin;
    readonly details: { bin: BizBin; caption: string; }[] = [];
    bizSearch: BizSearch;

    parser(context: PContext): PElement<IElement> {
        return new PBizSheet(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.main === undefined) debugger;
        let search: any;
        if (this.bizSearch !== undefined) {
            search = {};
            for (let { entity, buds } of this.bizSearch.params) {
                search[entity.id] = buds.map(v => v.id);
            }
        }
        ret = {
            ...ret,
            main: this.main.name,
            details: this.details.map(v => {
                const { bin, caption } = v;
                return {
                    bin: bin.name,
                    caption,                // 此处暂时不做res翻译
                }
            }),
            search,
        };
        return ret;
    }

    db(dbContext: DbContext): BBizSheet {
        return new BBizSheet(dbContext, this);
    }
}

export class BizPend extends BizEntity {
    static predefinedId = ['si', 'sx', 's'];
    static predefinedValue = ['value', 'price', 'amount', 'svalue', 'sprice', 'samount',];

    protected readonly fields = [...BizPend.predefinedId, ...BizPend.predefinedValue];
    readonly bizPhraseType = BizPhraseType.pend;
    readonly predefinedBuds: { [name: string]: BizBudValue };
    readonly predefinedFields: string[] = [];
    pendQuery: PendQuery;
    readonly bizBins: BizBin[] = [];
    i: BizBudID;
    x: BizBudID;

    constructor(biz: Biz) {
        super(biz);
        this.predefinedBuds = {};
        for (let n of BizPend.predefinedId) {
            this.predefinedBuds[n] = new BizBudID(this.biz, n, undefined);
        }
        for (let n of BizPend.predefinedValue) {
            this.predefinedBuds[n] = new BizBudDec(this.biz, n, undefined);
        }
    }

    parser(context: PContext): PElement<IElement> {
        return new PBizPend(this, context);
    }

    db(dbContext: DbContext): BBizPend {
        return new BBizPend(dbContext, this);
    }

    getBinProps(): Iterable<BizBud> {
        let budArr: BizBud[] = [];
        for (let bizBin of this.bizBins) {
            for (let [, p] of bizBin.props) {
                budArr.push(p);
            }
        }
        return budArr;
    }

    getSheetProps(): Iterable<BizBud> {
        let budArr: BizBud[] = [];
        for (let bizBin of this.bizBins) {
            budArr.push(...bizBin.getSheetProps());
        }
        return budArr;
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let predefined: { [name: string]: any } = {};
        for (let i in this.predefinedBuds) {
            let bud = this.predefinedBuds[i];
            predefined[i] = bud.buildSchema(res);
        }
        ret.predefined = predefined;
        if (this.pendQuery !== undefined) {
            let { params, from } = this.pendQuery;
            ret.params = params.map(v => v.buildSchema(res));
            ret.cols = from.cols.map(v => {
                const bud = v.field.getBud();
                return bud?.buildSchema(res);
            });
        }
        if (this.i !== undefined) ret.i = this.i.buildSchema(res);
        if (this.x !== undefined) ret.x = this.x.buildSchema(res);
        ret.predefinedFields = this.predefinedFields;
        return ret;
    }

    override getBud(name: string): BizBud {
        let bud = super.getBud(name);
        if (bud === undefined) {
            bud = this.predefinedBuds[name];
            if (bud === undefined) {
                if (name === 'i') return this.i;
                if (name === 'x') return this.x;
            }
        }
        return bud;
    }

    override forEachBud(callback: (bud: BizBud) => void): void {
        super.forEachBud(callback);
        if (this.i !== undefined) callback(this.i);
        if (this.x !== undefined) callback(this.x);
        if (this.pendQuery === undefined) return;
        const { from } = this.pendQuery;
        const { cols } = from;
        for (let col of cols) {
            let bud = col.field?.getBud();
            if (bud === undefined) continue;
            callback(bud);
        }
    }
    hasField(fieldName: string): boolean {
        let ret = this.fields.includes(fieldName);
        if (ret === true) return ret;
        if (fieldName === 'i' && this.i !== undefined) return true;
        if (fieldName === 'x' && this.x !== undefined) return true;
        if (this.props.has(fieldName) === true) return true;
        return false;
    }
}

export class BizQueryTableInPendStatements extends Statements {
    readonly pendQuery: PendQuery;
    constructor(pendQuery: PendQuery) {
        super(undefined);
        this.pendQuery = pendQuery;
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryTableInPendStatements(this, context);
    }
    db(db: Builder): object {
        return;
    }
}

export class PendQuery extends BizQueryTable {
    readonly bizPend: BizPend;
    constructor(bizPend: BizPend) {
        super(bizPend.biz);
        this.bizPend = bizPend;
    }
    parser(context: PContext): PElement<IElement> {
        return new PPendQuery(this, context);
    }
}
