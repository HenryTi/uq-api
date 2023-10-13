import { PBizCard, PCardAct, PCardDetail, PCardState, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizAct } from "./Act";
import { BizBase, BizPhraseType } from "./Base";
import { Biz } from "./Biz";
import { BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";

export class BizCard extends BizEntity {
    readonly bizPhraseType = BizPhraseType.card;
    readonly start = new CardState(this.biz, this);
    readonly states: { [name: string]: CardState } = {};

    parser(context: PContext): PElement<IElement> {
        return new PBizCard(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
        });
    }
}

export class CardState extends BizEntity {
    readonly bizPhraseType = BizPhraseType.cardState;
    readonly card: BizCard;
    readonly details: Map<string, CardDetail> = new Map();
    readonly act: CardAct = new CardAct(this);

    constructor(biz: Biz, card: BizCard) {
        super(biz);
        this.card = card;
    }
    override parser(context: PContext): PElement<IElement> {
        return new PCardState(this, context);
    }
}

export class CardDetail extends BizEntity {
    readonly bizPhraseType = BizPhraseType.cardDetail;
    readonly card: BizCard;

    constructor(biz: Biz, card: BizCard) {
        super(biz);
        this.card = card;
    }
    override parser(context: PContext): PElement<IElement> {
        return new PCardDetail(this, context);
    }
}

export class CardAct extends BizAct<CardState> {
    readonly type = 'cardAct';
    override parser(context: PContext): PElement<IElement> {
        return new PCardAct(this, context);
    }
}
