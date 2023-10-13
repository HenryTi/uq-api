import { BizBudValue, BizCard, CardAct, CardDetail, CardState } from "../../il";
import { Token } from "../tokens";
import { PBizAct } from "./Act";
import { PBizEntity } from "./Base";

export class PBizCard extends PBizEntity<BizCard> {
    protected keyColl = {}
    /*
    private prop = () => {
        this.parseCardProp(this.element.start.props);
    }

    private detail = () => {
        this.parseDetail(this.element.start.details);
    }

    private act = () => {
        let act = this.parseAct();
    }

    private state = () => {
        this.parseState();
    }
    /*
        prop: this.prop,
        detail: this.detail,
        act: this.act,
        state: this.state,
    }
    */
    protected override _parse(): void {
        this.context.parseElement(this.element.start);
    }
}

export class PCardDetail extends PBizEntity<CardDetail> {
    protected keyColl = {
        prop: this.parseProp,
    }
}

export class PCardState extends PBizEntity<CardState> {
    private parseDetail = () => {
        let detail = new CardDetail(this.element.biz, this.element.card);
        this.context.parseElement(detail);
        this.element.details.set(detail.name, detail);
    }
    private parseAct = () => {
        this.context.parseElement(this.element.act);
    }
    private parseState = () => {
        const { biz, card } = this.element;
        if (this.element !== card.start) {
            this.ts.error('can not define State in State');
        }
        let state = new CardState(biz, card);
        this.context.parseElement(state);
        card.states[state.name] = state;
    }
    protected keyColl = {
        prop: this.parseProp,
        detail: this.parseDetail,
        act: this.parseAct,
        state: this.parseState,
    }
}

export class PCardAct extends PBizAct<CardAct> {
    protected override _parse(): void {
        this.ts.passToken(Token.LBRACE);
        this.ts.passToken(Token.RBRACE);
        this.ts.mayPassToken(Token.SEMICOLON);
    }
}
