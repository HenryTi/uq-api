"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardAct = exports.CardDetail = exports.CardState = exports.BizCard = void 0;
const parser_1 = require("../../parser");
const Act_1 = require("./Act");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizCard extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.card;
        this.start = new CardState(this.biz, this);
        this.states = {};
    }
    parser(context) {
        return new parser_1.PBizCard(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {});
    }
}
exports.BizCard = BizCard;
class CardState extends Entity_1.BizEntity {
    constructor(biz, card) {
        super(biz);
        this.bizPhraseType = Base_1.BizPhraseType.cardState;
        this.details = new Map();
        this.act = new CardAct(this);
        this.card = card;
    }
    parser(context) {
        return new parser_1.PCardState(this, context);
    }
}
exports.CardState = CardState;
class CardDetail extends Entity_1.BizEntity {
    constructor(biz, card) {
        super(biz);
        this.bizPhraseType = Base_1.BizPhraseType.cardDetail;
        this.card = card;
    }
    parser(context) {
        return new parser_1.PCardDetail(this, context);
    }
}
exports.CardDetail = CardDetail;
class CardAct extends Act_1.BizAct {
    constructor() {
        super(...arguments);
        this.type = 'cardAct';
    }
    parser(context) {
        return new parser_1.PCardAct(this, context);
    }
}
exports.CardAct = CardAct;
//# sourceMappingURL=Card.js.map