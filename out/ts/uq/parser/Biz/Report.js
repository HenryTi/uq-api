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
        this.lists = [];
        this.parseTitle = () => {
            if (this.titles.length > 0) {
                this.ts.error(`Title can define only once in REPORT`);
            }
            for (;;) {
                let v = this.ts.passVar();
                this.titles.push(v);
                if (this.ts.token !== tokens_1.Token.DOT)
                    break;
                this.ts.readToken();
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseList = () => {
            let name = this.ts.passVar();
            let caption = this.ts.passString();
            this.ts.passKey('of');
            let atomName = this.ts.passVar();
            this.lists.push({ name, caption, atomName });
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = {
            title: this.parseTitle,
            list: this.parseList,
        };
    }
    scan(space) {
        let ok = true;
        let t0 = this.titles[0];
        if (t0 === undefined) {
            ok = false;
            this.log(`Report ${this.element.jName} must define Title`);
        }
        else {
            if (this.titles.length !== 2) {
                ok = false;
                this.log('Title must be entity.bud');
            }
            let entity = space.getBizEntity(t0);
            if (entity === undefined || entity.bizPhraseType !== il_1.BizPhraseType.title) {
                ok = false;
                this.log(`${t0} is not a title`);
            }
            else {
                let t1 = this.titles[1];
                let title = entity;
                let bud = title.getBud(t1);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${t1} is not a prop of ${title.jName}`);
                }
                else {
                    this.element.title = {
                        title,
                        bud,
                    };
                }
            }
        }
        for (let { name, caption, atomName } of this.lists) {
            let entity = space.getBizEntity(atomName);
            if (entity === undefined
                || (entity.bizPhraseType !== il_1.BizPhraseType.atom
                    && entity.bizPhraseType !== il_1.BizPhraseType.spec)) {
                ok = false;
                this.log(`${atomName} is neither ATON nor SPEC`);
            }
            let r = new il_1.ReportList(name, caption);
            this.element.lists.push(r);
            r.atom = entity;
        }
        return ok;
    }
}
exports.PBizReport = PBizReport;
//# sourceMappingURL=Report.js.map