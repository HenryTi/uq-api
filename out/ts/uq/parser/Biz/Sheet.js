"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizSheet = void 0;
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizSheet extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.details = [];
        this.parseIO = () => {
            this.element.io = true;
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
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
        this.parseSheetSearch = () => {
            let bizSearch = this.parseSearch(this.element);
            this.element.bizSearch = bizSearch;
        };
        this.keyColl = {
            io: this.parseIO,
            prop: this.parseProp,
            i: this.parseMain,
            main: this.parseMain,
            x: this.parseDetail,
            detail: this.parseDetail,
            permit: this.parsePermit,
            search: this.parseSheetSearch,
            user: this.parseBizUser,
        };
    }
    scan0(space) {
        let ok = true;
        if (this.main === undefined) {
            this.log(`Biz Sheet must define main`);
            ok = false;
        }
        let main = this.getBizEntity(space, this.main, BizPhraseType_1.BizPhraseType.bin);
        if (main === undefined) {
            this.log(`MAIN ${this.main} is not defined`);
            ok = false;
        }
        else {
            this.element.main = main;
        }
        for (let { name, caption } of this.details) {
            let bin = this.getBizEntity(space, name, BizPhraseType_1.BizPhraseType.bin);
            if (bin === undefined) {
                ok = false;
                continue;
            }
            this.element.details.push({ bin, caption });
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        const { bizSearch } = this.element;
        if (bizSearch !== undefined) {
            if (bizSearch.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        const { outs, main, details } = this.element;
        const mainOuts = main.outs;
        function setOut(name, useOut) {
            let out = outs[name];
            if (out === undefined) {
                outs[name] = useOut;
                return;
            }
            if (useOut.to === true)
                out.to = true;
        }
        for (let i in mainOuts) {
            setOut(i, mainOuts[i]);
        }
        for (let detail of details) {
            const detailOuts = detail.bin.outs;
            for (let i in detailOuts) {
                setOut(i, detailOuts[i]);
            }
        }
        for (let i in outs) {
            let out = outs[i];
            if (out.to !== true) {
                ok = false;
                const { out: bizOut } = out;
                this.log(`Biz OUT ${bizOut.getJName()} in Sheet ${this.element.getJName()} without TO`);
            }
        }
        return ok;
    }
}
exports.PBizSheet = PBizSheet;
//# sourceMappingURL=Sheet.js.map