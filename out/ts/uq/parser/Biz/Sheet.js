"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizSheet = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizSheet extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.details = [];
        this.parseMain = () => {
            if (this.main !== undefined) {
                this.ts.error(`main can only be defined once in Biz Sheet`);
            }
            this.main = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseDetail = () => {
            let name = this.ts.passVar();
            let caption = this.ts.mayPassString();
            this.details.push({ name, caption });
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parsePermit = () => {
            this.parsePermission('crud');
        };
        this.keyColl = {
            prop: this.parseProp,
            main: this.parseMain,
            detail: this.parseDetail,
            permit: this.parsePermit,
        };
    }
    scan0(space) {
        let ok = true;
        if (this.main === undefined) {
            this.log(`Biz Sheet must define main`);
            ok = false;
        }
        let main = this.getBizEntity(space, this.main, il_1.BizPhraseType.bin);
        if (main === undefined) {
            this.log(`MAIN ${this.main} is not defined`);
            ok = false;
        }
        else {
            this.element.main = main;
        }
        for (let { name, caption } of this.details) {
            let detail = this.getBizEntity(space, name, il_1.BizPhraseType.bin);
            if (detail === undefined) {
                ok = false;
                continue;
            }
            this.element.details.push({ bin: detail, caption });
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        return ok;
    }
    scan2(uq) {
        let ok = true;
        return ok;
    }
}
exports.PBizSheet = PBizSheet;
//# sourceMappingURL=Sheet.js.map