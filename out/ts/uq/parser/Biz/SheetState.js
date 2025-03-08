"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinStateActFieldSpace = exports.PBinStateActStatements = exports.PBinStateAct = exports.PBinState = exports.PSheetState = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
const Bin_1 = require("./Bin");
const Biz_1 = require("./Biz");
const BizField_1 = require("../../il/BizField");
class PSheetState extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseMain = () => {
            let binState = new il_1.BinState(this.element);
            this.context.parseElement(binState);
            this.element.main = binState;
        };
        this.parseDetail = () => {
            let binState = new il_1.BinState(this.element);
            this.context.parseElement(binState);
            this.element.details.push(binState);
        };
        this.keyColl = {
            main: this.parseMain,
            detail: this.parseDetail,
        };
    }
    parseHeader() {
        this.element.name = this.ts.token === tokens_1.Token.VAR ?
            this.ts.passVar() : '$';
        this.element.ui = this.parseUI();
    }
    scan0(space) {
        let ok = true;
        const { sheet, main, details } = this.element;
        if (main !== undefined) {
            main.bin = sheet.main;
            if (main.pelement.scan0(space) === false)
                ok = false;
        }
        for (let detail of details) {
            const { name } = detail;
            const { details: sheetDetails } = sheet;
            if (name === undefined || name === '$') {
                if (sheetDetails.length > 1) {
                    ok = false;
                    this.log(`DETAIL must have name`);
                }
                else {
                    detail.bin = sheetDetails[0].bin;
                }
            }
            else {
                let sheetDetail = sheetDetails.find(v => v.bin.name === name);
                if (sheetDetail === undefined) {
                    ok = false;
                    this.log(`Sheet DETAIL ${name} not defined`);
                }
                else {
                    detail.bin = sheetDetail.bin;
                }
            }
            if (detail.pelement.scan0(space) === false)
                ok = false;
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        const { main, details } = this.element;
        if (main !== undefined) {
            if (main.pelement.scan(space) === false)
                ok = false;
        }
        for (let detail of details) {
            if (detail.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        const { main, details } = this.element;
        if (main !== undefined) {
            if (main.pelement.scan2(uq) === false)
                ok = false;
        }
        for (let detail of details) {
            if (detail.pelement.scan2(uq) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PSheetState = PSheetState;
class PBinState extends Bin_1.PBizBinBase {
    constructor() {
        super(...arguments);
        this.parseEdit = () => {
            this.edit = [];
            if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
                this.ts.expectToken(tokens_1.Token.LPARENTHESE);
                return;
            }
            this.ts.readToken();
            for (;;) {
                this.edit.push(this.ts.passVar());
                const { token } = this.ts;
                if (token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                    continue;
                }
                this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
                break;
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = {
            act: this.parseAct,
            edit: this.parseEdit,
        };
    }
    createBizBinBaseAct() {
        return new il_1.BinStateAct(this.element);
    }
    parseHeader() {
        this.element.name = this.ts.token === tokens_1.Token.VAR ?
            this.ts.passVar() : '$';
    }
    scan0(space) {
        let ok = super.scan0(space);
        const { act, bin } = this.element;
        let binSpace = new Bin_1.BizBinSpace(space, bin);
        if (act !== undefined) {
            if (act.pelement.scan0(binSpace) === false)
                ok = false;
        }
        return ok;
    }
    scan(space) {
        let ok = super.scan(space);
        const { act, bin } = this.element;
        let binSpace = new Bin_1.BizBinSpace(space, bin);
        if (act !== undefined) {
            if (act.pelement.scan(binSpace) === false)
                ok = false;
        }
        if (this.edit !== undefined) {
            this.element.edit = [];
            let { edit, bin } = this.element;
            for (let eb of this.edit) {
                let bud = bin.getBud(eb);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${eb} not defined in BIN ${bin.getJName()}`);
                }
                else {
                    edit.push(bud);
                }
            }
        }
        return ok;
    }
    scan2(uq) {
        let ok = super.scan2(uq);
        const { act } = this.element;
        if (act !== undefined) {
            if (act.pelement.scan2(uq) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PBinState = PBinState;
class PBinStateAct extends Base_1.PBizAct {
    createBizActStatements() {
        return new il_1.BinStateActStatements(undefined, this.element);
    }
    createBizActSpace(space) {
        return new BinStateActSpace(space, this.element.binState);
    }
}
exports.PBinStateAct = PBinStateAct;
class PBinStateActStatements extends Base_1.PBizActStatements {
    createBizActStatement(parent) {
        return new il_1.BizStatementBinState(parent, this.bizAct);
    }
}
exports.PBinStateActStatements = PBinStateActStatements;
class BinStateActSpace extends Biz_1.BizEntitySpace {
    constructor(outer, binState) {
        super(outer, binState);
        this.varNo = 1;
        this.bizFieldSpace = new BinStateActFieldSpace(binState);
    }
    _varPointer(name, isField) {
        return undefined;
    }
    _varsPointer(names) {
        return undefined;
    }
    getVarNo() { return this.varNo; }
    setVarNo(value) { this.varNo = value; }
    _getBizFromEntityFromAlias(name) {
        switch (name) {
            default:
                return super._getBizFromEntityFromAlias(name);
            case 'pend':
                return;
        }
    }
    _getBizField(names) {
        return this.bizFieldSpace.getBizField(names);
    }
}
class BinStateActFieldSpace extends BizField_1.BizFieldSpace {
    constructor(binState) {
        super();
        this.binState = binState;
    }
    buildBizFieldFromDuo(n0, n1) {
        return undefined;
    }
}
exports.BinStateActFieldSpace = BinStateActFieldSpace;
//# sourceMappingURL=SheetState.js.map