import { DbContext, BBizEntity, BBizIn, BBizOut } from "../../builder";
import { PBizIn, PBizInAct, PBizOut, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizAct } from "./Base";
import { Biz } from "./Biz";
import { BizPhraseType } from "./BizPhraseType";
import { BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";

/*
export interface BizInOutArr {
    name: string;
    props: Map<string, BizBudValue>;
    arrs: { [name: string]: BizInOutArr; };
}
*/
export abstract class BizInOut extends BizEntity {
    protected readonly fields = [];
    // readonly arrs: { [name: string]: BizInOutArr; } = {};
}

export class BizIn extends BizInOut {
    readonly bizPhraseType = BizPhraseType.in;
    act: BizInAct;

    parser(context: PContext): PElement<IElement> {
        return new PBizIn(this, context);
    }

    db(dbContext: DbContext): BBizEntity<any> {
        return new BBizIn(dbContext, this);
    }
}

export class BizOut extends BizInOut {
    readonly bizPhraseType = BizPhraseType.out;

    parser(context: PContext): PElement<IElement> {
        return new PBizOut(this, context);
    }

    db(dbContext: DbContext): BBizEntity<any> {
        return new BBizOut(dbContext, this);
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
