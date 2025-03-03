"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizSheet = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizSheet extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.details = [];
        this.prints = [];
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
            let operate = il_1.EnumDetailOperate.default;
            if (this.ts.isKeywordToken === true) {
                switch (this.ts.lowerVar) {
                    case 'operate':
                        this.ts.readToken();
                        const operateOptions = Object.keys(il_1.EnumDetailOperate);
                        if (this.ts.isKeywordToken === false) {
                            this.ts.expect(...operateOptions);
                        }
                        operate = il_1.EnumDetailOperate[this.ts.lowerVar];
                        this.ts.readToken();
                        break;
                }
            }
            this.details.push({ name, caption, operate });
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parsePermit = () => {
            this.parsePermission('crud');
        };
        this.parseSheetSearch = () => {
            let bizSearch = this.parseSearch(this.element);
            this.element.bizSearch = bizSearch;
        };
        this.parsePrint = () => {
            let name, caption;
            if (this.ts.token === tokens_1.Token.VAR) {
                name = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.STRING) {
                    caption = this.ts.text;
                    this.ts.readToken();
                }
            }
            this.ts.passToken(tokens_1.Token.LBRACE);
            let main;
            let details = [];
            for (;;) {
                if (this.ts.token === tokens_1.Token.RBRACE) {
                    this.ts.readToken();
                    break;
                }
                let key = this.ts.passKey();
                switch (key) {
                    default:
                        this.ts.expect('main', 'detail');
                        break;
                    case 'main':
                        if (main !== undefined) {
                            this.ts.error('duplicate MAIN');
                        }
                        main = this.ts.passVar();
                        break;
                    case 'detail':
                        let detail = this.ts.passVar();
                        let templet = this.ts.passVar();
                        if (details.findIndex(([d]) => d === detail) >= 0) {
                            this.ts.error(`duplicate DETAIL ${detail}`);
                        }
                        details.push([detail, templet]);
                        break;
                }
                this.ts.passToken(tokens_1.Token.SEMICOLON);
            }
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
            this.prints.push({ name, caption, main, details });
        };
        this.parseState = () => {
            let state = new il_1.SheetState(this.element);
            this.context.parseElement(state);
            let { states } = this.element;
            if (states === undefined) {
                this.element.states = states = [];
            }
            states.push(state);
        };
        this.keyColl = {
            io: this.parseIO,
            prop: this.parseProp,
            i: this.parseMain,
            x: this.parseDetail,
            main: this.parseMain,
            detail: this.parseDetail,
            state: this.parseState,
            permit: this.parsePermit,
            search: this.parseSheetSearch,
            user: this.parseBizUser,
            print: this.parsePrint,
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
        for (let { name, caption, operate } of this.details) {
            let bin = this.getBizEntity(space, name, BizPhraseType_1.BizPhraseType.bin);
            if (bin === undefined) {
                ok = false;
                continue;
            }
            this.element.details.push({ bin, caption, operate });
        }
        const { states } = this.element;
        if (states !== undefined) {
            let statesSet = new Set();
            for (let state of states) {
                const { name } = state;
                if (statesSet.has(name) === true) {
                    ok = false;
                    this.log(`STATE ${name} defined more than once`);
                }
                if (state.pelement.scan0(space) === false)
                    ok = false;
            }
            let stateDiscard = new il_1.SheetState(this.element);
            states.push(stateDiscard);
            stateDiscard.name = '$discard';
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
        const { states } = this.element;
        if (states !== undefined) {
            for (let state of states) {
                const { pelement } = state;
                if (pelement === undefined)
                    continue;
                if (pelement.scan(space) === false)
                    ok = false;
            }
        }
        return ok;
    }
    scan2(uq) {
        var _a, _b, _c, _d;
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
            const { bin } = detail;
            const { pickArr, outs: detailOuts } = bin;
            if (pickArr !== undefined) {
                for (let pick of pickArr) {
                    if (main.getBud(pick.name) !== undefined) {
                        this.log(`${(_b = (_a = bin.ui) === null || _a === void 0 ? void 0 : _a.caption) !== null && _b !== void 0 ? _b : bin.name} PICK ${pick.name} should not duplicate of MAIN ${(_d = (_c = main.ui) === null || _c === void 0 ? void 0 : _c.caption) !== null && _d !== void 0 ? _d : main.name} bud name`);
                        ok = false;
                    }
                }
            }
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
        const { states } = this.element;
        if (states !== undefined) {
            for (let state of states) {
                const { pelement } = state;
                if (pelement === undefined)
                    continue;
                if (pelement.scan2(uq) === false)
                    ok = false;
            }
        }
        return ok;
    }
}
exports.PBizSheet = PBizSheet;
//# sourceMappingURL=Sheet.js.map