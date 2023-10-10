"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizReport = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizReport extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.titles = [];
        this.joins = [];
        this.parseTitles = () => {
            if (this.titles.length > 0) {
                this.ts.error(`Title can define only once in REPORT`);
            }
            if (this.ts.token === tokens_1.Token.LPARENTHESE) {
                this.ts.readToken();
                for (;;) {
                    this.titles.push(this.passTitle());
                    if (this.ts.token === tokens_1.Token.COMMA) {
                        this.ts.readToken();
                        if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                            this.ts.readToken();
                            break;
                        }
                    }
                    else if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                    else {
                        this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
                    }
                }
            }
            else {
                this.titles.push(this.passTitle());
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseFrom = () => {
            this.from = this.ts.passVar();
            for (;;) {
                let join = this.ts.passKey();
                let type;
                switch (join) {
                    default:
                        this.ts.expect('X', 'TO');
                        break;
                    case 'x':
                        type = il_1.ReportJoinType.x;
                        break;
                    case 'to':
                        type = il_1.ReportJoinType.to;
                        break;
                }
                let entity = this.ts.passVar();
                this.joins.push({ type, entity });
                if (this.ts.token === tokens_1.Token.SEMICOLON) {
                    this.ts.readToken();
                    break;
                }
            }
        };
        /*
        private parseList = () => {
            let name = this.ts.passVar();
            let caption = this.ts.passString();
            this.ts.passKey('of');
            let atomName = this.ts.passVar();
            this.lists.push({ name, caption, atomName });
            this.ts.passToken(Token.SEMICOLON);
        }
        */
        this.parsePermit = () => {
            this.parsePermission('');
        };
        this.keyColl = {
            title: this.parseTitles,
            from: this.parseFrom,
            permit: this.parsePermit,
        };
    }
    passTitle() {
        let v0 = this.ts.passVar();
        this.ts.passToken(tokens_1.Token.DOT);
        let v1 = this.ts.passVar();
        let caption = this.ts.mayPassString();
        return { title: [v0, v1], caption };
    }
    scan(space) {
        let ok = true;
        if (this.titles.length === 0) {
            ok = false;
            this.log(`Report ${this.element.jName} must define Title`);
        }
        else {
            for (let t of this.titles) {
                let { title: [t0, t1], caption } = t;
                let entity = space.getBizEntity(t0);
                if (entity === undefined || entity.bizPhraseType !== il_1.BizPhraseType.title) {
                    ok = false;
                    this.log(`${t0} is not a title`);
                }
                else {
                    let title = entity;
                    let bud = title.getBud(t1);
                    if (bud === undefined) {
                        ok = false;
                        this.log(`${t1} is not a prop of ${title.jName}`);
                    }
                    else {
                        this.element.titles.push({
                            caption,
                            title,
                            bud,
                        });
                    }
                }
            }
        }
        if (this.from === undefined) {
            ok = false;
            this.log('FROM must be defined');
        }
        else {
            let entity = space.getBizEntity(this.from);
            if (entity === undefined) {
                ok = false;
                this.log(`${this.from} is not a ATOM`);
            }
            else if (entity.bizPhraseType !== il_1.BizPhraseType.atom) {
                ok = false;
                this.log(`FROM ${this.from} must be ATOM`);
            }
            else {
                this.element.from = entity;
            }
            for (let join of this.joins) {
                let { type, entity } = join;
                let en = space.getBizEntity(entity);
                if (en === undefined) {
                    ok = false;
                    this.log(`${entity} is unknown`);
                }
                this.element.joins.push({ type, entity: en });
            }
        }
        return ok;
    }
}
exports.PBizReport = PBizReport;
//# sourceMappingURL=Report.js.map