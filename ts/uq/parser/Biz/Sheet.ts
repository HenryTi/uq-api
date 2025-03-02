import {
    BizBin, BizSheet, EnumDetailOperate, SheetState, UI, Uq, UseOut
} from "../../il";
import { BizPhraseType } from "../../il/Biz/BizPhraseType";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

interface PPrint {
    name: string;
    caption: string;
    main: string;
    details: [string, string][];
}
export class PBizSheet extends PBizEntity<BizSheet> {
    private main: string;
    private details: { name: string, caption: string, operate: EnumDetailOperate; }[] = [];
    private readonly prints: PPrint[] = [];

    private parseIO = () => {
        this.element.io = true;
        this.ts.passToken(Token.SEMICOLON);
    };

    private parseMain = () => {
        if (this.main !== undefined) {
            this.ts.error(`main can only be defined once in Biz Sheet`);
        }
        this.main = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseDetail = () => {
        let name = this.ts.passVar();
        let caption = this.ts.mayPassString();
        let operate: EnumDetailOperate = EnumDetailOperate.default;
        if (this.ts.isKeywordToken === true) {
            switch (this.ts.lowerVar) {
                case 'operate':
                    this.ts.readToken();
                    const operateOptions = Object.keys(EnumDetailOperate);
                    if (this.ts.isKeywordToken as any === false) {
                        this.ts.expect(...operateOptions);
                    }
                    operate = EnumDetailOperate[this.ts.lowerVar];
                    this.ts.readToken();
                    break;
            }

        }
        this.details.push({ name, caption, operate });
        this.ts.passToken(Token.SEMICOLON);
    }

    private parsePermit = () => {
        this.parsePermission('crud');
    }

    private parseSheetSearch = () => {
        let bizSearch = this.parseSearch(this.element);
        this.element.bizSearch = bizSearch;
    }

    private parsePrint = () => {
        let name: string, caption: string;
        if (this.ts.token === Token.VAR) {
            name = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token === Token.STRING as any) {
                caption = this.ts.text;
                this.ts.readToken();
            }
        }
        this.ts.passToken(Token.LBRACE);
        let main: string;
        let details: [string, string][] = [];
        for (; ;) {
            if (this.ts.token === Token.RBRACE) {
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
            this.ts.passToken(Token.SEMICOLON);
        }
        this.ts.mayPassToken(Token.SEMICOLON);
        this.prints.push({ name, caption, main, details });
    }

    parseState = () => {
        let state = new SheetState(this.element);
        this.context.parseElement(state);
        let { states } = this.element;
        if (states === undefined) {
            this.element.states = states = [];
        }
        states.push(state);
    }

    readonly keyColl = {
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

    scan0(space: Space): boolean {
        let ok = true;
        if (this.main === undefined) {
            this.log(`Biz Sheet must define main`);
            ok = false;
        }
        let main = this.getBizEntity<BizBin>(space, this.main, BizPhraseType.bin);
        if (main === undefined) {
            this.log(`MAIN ${this.main} is not defined`);
            ok = false;
        }
        else {
            this.element.main = main;
        }
        for (let { name, caption, operate } of this.details) {
            let bin = this.getBizEntity<BizBin>(space, name, BizPhraseType.bin);
            if (bin === undefined) {
                ok = false;
                continue;
            }
            this.element.details.push({ bin, caption, operate });
        }
        const { states } = this.element;
        if (states !== undefined) {
            for (let state of states) {
                if (state.pelement.scan0(space) === false) ok = false;
            }
            let stateDiscard = new SheetState(this.element);
            states.push(stateDiscard);
            stateDiscard.name = '$discard';
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
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
                if (pelement === undefined) continue;
                if (pelement.scan(space) === false) ok = false;
            }
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        const { outs, main, details } = this.element;
        const mainOuts = main.outs;
        function setOut(name: string, useOut: UseOut) {
            let out = outs[name];
            if (out === undefined) {
                outs[name] = useOut;
                return;
            }
            if (useOut.to === true) out.to = true;
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
                        this.log(`${bin.ui?.caption ?? bin.name} PICK ${pick.name} should not duplicate of MAIN ${main.ui?.caption ?? main.name} bud name`);
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
                if (pelement === undefined) continue;
                if (pelement.scan2(uq) === false) ok = false;
            }
        }
        return ok;
    }
}
