import { PBizIn, PBizInAct, PBizOut, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizAct } from "./Base";
import { Biz } from "./Biz";
import { BizPhraseType } from "./BizPhraseType";
import { BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";

export interface InOutArr {
    name: string;
    props: Map<string, BizBudValue>;
}

export abstract class BizInOut extends BizEntity {
    protected readonly fields = [];
    readonly arrs: { [name: string]: InOutArr; } = {};
}

export class BizIn extends BizInOut {
    readonly bizPhraseType = BizPhraseType.in;
    act: BizInAct;

    parser(context: PContext): PElement<IElement> {
        return new PBizIn(this, context);
    }
}

export class BizOut extends BizInOut {
    readonly bizPhraseType = BizPhraseType.out;

    parser(context: PContext): PElement<IElement> {
        return new PBizOut(this, context);
    }
}

export class BizInAct extends BizAct {
    readonly bizIn: BizIn;
    constructor(biz: Biz, bizIn: BizIn) {
        super(biz);
        this.bizIn = bizIn;
    }

    parser(context: PContext): PElement<IElement> {
        return new PBizInAct(this, context);
    }
}
