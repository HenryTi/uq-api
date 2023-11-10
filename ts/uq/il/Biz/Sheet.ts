import { BBizPend, BBizSheet, DbContext } from "../../builder";
import { PBizPend, PBizQueryTableInPendStatements, PBizSheet, PContext, PElement, PPendQuery } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../element";
import { Statements } from "../statement";
import { BizPhraseType } from "./Base";
import { BizBin } from "./Bin";
import { Biz } from "./Biz";
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

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let predefined: { [name: string]: any } = {};
        for (let i in this.predefinedBuds) {
            let bud = this.predefinedBuds[i];
            // let { ui } = bud;
            // if (uicaption === undefined) continue;
            predefined[i] = bud.buildSchema(res);
        }
        ret.predefined = predefined;
        return ret;
    }

    override getBud(name: string): BizBud {
        let bud = super.getBud(name);
        if (bud === undefined) {
            bud = this.predefinedBuds[name];
        }
        return bud;
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
