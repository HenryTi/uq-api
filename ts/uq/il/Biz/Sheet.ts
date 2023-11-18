import { BBizPend, BBizSheet, DbContext } from "../../builder";
import { PBizPend, PBizQueryTableInPendStatements, PBizSheet, PContext, PElement, PPendQuery } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../IElement";
import { Statements } from "../statement";
import { BizBin } from "./Bin";
import { Biz } from "./Biz";
import { BizPhraseType } from "./BizPhraseType";
import { BizBudValue, BizBudAtom, BizBudDec, BizBud } from "./Bud";
import { BizEntity } from "./Entity";
import { BizQueryTable } from "./Query";

export class BizSheet extends BizEntity {
    protected readonly fields = ['id', 'no'];
    readonly bizPhraseType = BizPhraseType.sheet;
    main: BizBin;
    readonly details: { bin: BizBin; caption: string; }[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizSheet(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.main === undefined) debugger;
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
        };
        return ret;
    }

    db(dbContext: DbContext): BBizSheet {
        return new BBizSheet(dbContext, this);
    }
}

export class BizPend extends BizEntity {
    static predefinedId = ['i', 'x', 'si', 'sx', 's'];
    static predefinedValue = ['value', 'price', 'amount', 'svalue', 'sprice', 'samount',];

    protected readonly fields = [...BizPend.predefinedId, ...BizPend.predefinedValue];
    readonly bizPhraseType = BizPhraseType.pend;
    readonly predefinedBuds: { [name: string]: BizBudValue };
    pendQuery: PendQuery;
    readonly bizBins: BizBin[] = [];
    constructor(biz: Biz) {
        super(biz);
        this.predefinedBuds = {};
        for (let n of BizPend.predefinedId) {
            this.predefinedBuds[n] = new BizBudAtom(this.biz, n, undefined);
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

    getBinProps(): Iterable<BizBudValue> {
        let budArr: BizBudValue[] = [];
        for (let bizBin of this.bizBins) {
            for (let [, p] of bizBin.props) {
                budArr.push(p);
            }
        }
        return budArr;
    }

    getSheetProps(): Iterable<BizBudValue> {
        let budArr: BizBudValue[] = [];
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
        return ret;
    }

    override getBud(name: string): BizBud {
        let bud = super.getBud(name);
        if (bud === undefined) {
            bud = this.predefinedBuds[name];
        }
        return bud;
    }

    override forEachBud(callback: (bud: BizBud) => void): void {
        super.forEachBud(callback);
        if (this.pendQuery === undefined) return;
        const { from } = this.pendQuery;
        const { cols } = from;
        for (let col of cols) {
            let bud = col.field?.getBud();
            if (bud === undefined) continue;
            callback(bud);
        }
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
