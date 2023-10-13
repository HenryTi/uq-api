"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PCardAct = exports.PCardState = exports.PCardDetail = exports.PBizCard = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Act_1 = require("./Act");
const Base_1 = require("./Base");
class PBizCard extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {};
    }
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
    _parse() {
        this.context.parseElement(this.element.start);
    }
}
exports.PBizCard = PBizCard;
class PCardDetail extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {
            prop: this.parseProp,
        };
    }
}
exports.PCardDetail = PCardDetail;
class PCardState extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseDetail = () => {
            let detail = new il_1.CardDetail(this.element.biz, this.element.card);
            this.context.parseElement(detail);
            this.element.details.set(detail.name, detail);
        };
        this.parseAct = () => {
            this.context.parseElement(this.element.act);
        };
        this.parseState = () => {
            const { biz, card } = this.element;
            if (this.element !== card.start) {
                this.ts.error('can not define State in State');
            }
            let state = new il_1.CardState(biz, card);
            this.context.parseElement(state);
            card.states[state.name] = state;
        };
        this.keyColl = {
            prop: this.parseProp,
            detail: this.parseDetail,
            act: this.parseAct,
            state: this.parseState,
        };
    }
}
exports.PCardState = PCardState;
class PCardAct extends Act_1.PBizAct {
    _parse() {
        this.ts.passToken(tokens_1.Token.LBRACE);
        this.ts.passToken(tokens_1.Token.RBRACE);
        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
    }
}
exports.PCardAct = PCardAct;
//# sourceMappingURL=Card.js.map