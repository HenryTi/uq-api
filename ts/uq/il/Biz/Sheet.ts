import { BBizSheet, DbContext } from "../../builder";
import { PBizPend, PBizSheet, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizPhraseType } from "./Base";
import { BizBin } from "./Bin";
import { Biz } from "./Biz";
import { BizBudValue, BizBudAtom, BizBudDec, BizBud } from "./Bud";
import { BizEntity } from "./Entity";

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

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let predefined: { [name: string]: any } = {};
        for (let i in this.predefinedBuds) {
            let bud = this.predefinedBuds[i];
            let { caption } = bud;
            if (caption === undefined) continue;
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

