"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detailPreDefined = exports.PBizDetailActStatements = exports.PBizDetailAct = exports.PBizPend = exports.PBizBin = exports.PBizSheet = void 0;
const il_1 = require("../../il");
const space_1 = require("../space");
const statement_1 = require("../statement");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizSheet extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.details = [];
        /*
        protected parseContent(): void {
            const keyColl = {
                prop: this.parseProp,
                main: this.parseMain,
                detail: this.parseDetail,
            };
            const keys = Object.keys(keyColl);
            for (; ;) {
                if (this.ts.token === Token.RBRACE) break;
                let parse = keyColl[this.ts.lowerVar];
                if (this.ts.varBrace === true || parse === undefined) {
                    this.ts.expect(...keys);
                }
                this.ts.readToken();
                parse();
            }
        }
        */
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
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
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
    scan2(uq) {
        let ok = true;
        return ok;
    }
}
exports.PBizSheet = PBizSheet;
class PBizBin extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parsePend = () => {
            if (this.pend !== undefined) {
                this.ts.error(`PEND can only be defined once in Biz Bin`);
            }
            this.pend = this.ts.passVar();
            this.pendCaption = this.ts.mayPassString();
            this.ts.passToken(tokens_1.Token.LBRACE);
            for (;;) {
                if (this.ts.token === tokens_1.Token.RBRACE) {
                    this.ts.readToken();
                    break;
                }
                let key = this.ts.passKey();
                if (key === 'search') {
                    if (this.ts.token === tokens_1.Token.LPARENTHESE) {
                        this.pendSearch = [];
                        for (;;) {
                            let sKey = this.ts.passKey();
                            this.pendSearch.push(sKey);
                            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                                this.ts.readToken();
                                break;
                            }
                            if (this.ts.token === tokens_1.Token.COMMA) {
                                this.ts.readToken();
                                continue;
                            }
                            this.ts.expectToken(tokens_1.Token.RPARENTHESE, tokens_1.Token.COMMA);
                        }
                    }
                    else {
                        let sKey = this.ts.passKey();
                        this.pendSearch = [sKey];
                    }
                    this.ts.passToken(tokens_1.Token.SEMICOLON);
                }
                else {
                    this.ts.expect('search');
                    break;
                }
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseI = () => {
            if (this.element.i !== undefined) {
                this.ts.error(`I can only be defined once in Biz Bin`);
            }
            this.element.i = this.parseBudPickable('i');
        };
        this.parseX = () => {
            if (this.element.x !== undefined) {
                this.ts.error(`X can only be defined once in Biz Bin`);
            }
            this.element.x = this.parseBudPickable('x');
        };
        this.parseValue = () => {
            this.element.value = this.parseValueBud(this.element.value, 'value');
        };
        this.parsePrice = () => {
            this.element.price = this.parseValueBud(this.element.price, 'price');
        };
        this.parseAmount = () => {
            this.element.amount = this.parseValueBud(this.element.amount, 'amount');
        };
        this.parseAct = () => {
            const { act } = this.element;
            if (act !== undefined) {
                this.ts.error('ACT can only be defined once');
            }
            let bizBinAct = new il_1.BizBinAct(this.element.biz, this.element);
            this.element.act = bizBinAct;
            this.context.parseElement(bizBinAct);
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = {
            prop: this.parseProp,
            i: this.parseI,
            x: this.parseX,
            value: this.parseValue,
            price: this.parsePrice,
            amount: this.parseAmount,
            act: this.parseAct,
            pend: this.parsePend,
        };
    }
    parseBudPickable(itemName) {
        let caption = this.ts.mayPassString();
        let bud = new il_1.BizBudPickable(this.element.biz, itemName, caption);
        this.context.parseElement(bud);
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        return bud;
    }
    parseValueBud(bud, budName) {
        if (bud !== undefined) {
            this.ts.error(`${budName} can only define once`);
        }
        let caption = this.ts.mayPassString();
        let bizBud = this.parseBud(budName, caption);
        if (this.ts.prevToken !== tokens_1.Token.RBRACE) {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
        return bizBud;
    }
    scan(space) {
        let ok = true;
        let binSpace = new BinSpace(space, this.element);
        if (super.scan(binSpace) === false)
            ok = false;
        space = new BizBinSpace(binSpace, this.element);
        if (this.pend !== undefined) {
            let pend = this.getBizEntity(binSpace, this.pend, il_1.BizPhraseType.pend);
            if (pend === undefined) {
                this.log(`PEND '${this.pend}' is not defined`);
                ok = false;
            }
            else {
                if (this.pendSearch === undefined || this.pendSearch.length === 0) {
                    this.log(`Search keys must be defined`);
                    ok = false;
                }
                else {
                    let { predefinedId } = il_1.BizPend;
                    for (let i of this.pendSearch) {
                        if (predefinedId.includes(i) === false) {
                            this.log(`Pend ${pend.jName} has not ${i}`);
                            ok = false;
                        }
                    }
                }
                this.element.pend = {
                    caption: this.pendCaption,
                    entity: pend,
                    search: this.pendSearch,
                };
            }
        }
        const { i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (i !== undefined) {
            if (this.scanBud(space, i) === false) {
                ok = false;
            }
        }
        if (x !== undefined) {
            if (this.scanBud(space, x) === false) {
                ok = false;
            }
        }
        const scanBudValue = (bud) => {
            if (bud === undefined)
                return;
            const { dataType } = bud;
            if (dataType !== il_1.BudDataType.dec && dataType !== il_1.BudDataType.none) {
                this.log(`${bud.jName} can only be DEC`);
                ok = false;
            }
            const { value } = bud;
            if (value !== undefined) {
                const { exp, query } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
                else if (query !== undefined) {
                    if (query.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
            }
        };
        scanBudValue(budValue);
        scanBudValue(budAmount);
        scanBudValue(budPrice);
        let { act } = this.element;
        if (act !== undefined) {
            if (act.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        // const { item, value: budValue, amount: budAmount, price: budPrice } = this.element;
        /*
        if (item !== undefined) return ok;
        const itemBud: BizBudAtom = item as BizBudAtom;
        let { atom } = itemBud;
        if (atom !== undefined) {
            const { uom } = atom as BizAtom;
            if (uom === undefined) {
                this.log(`ATOM '${atom.name}' does not define UOM, can not be used in DETAIL`);
                ok = false;
            }
        }
        */
        return ok;
    }
}
exports.PBizBin = PBizBin;
const binVars = [
    'bin', 'i', 'x',
    'value', 'amount', 'price',
    's', 'si', 'sx', 'svalue', 'sprice', 'samount', 'pend'
];
class BinSpace extends space_1.Space {
    constructor(outerSpace, bin) {
        super(outerSpace);
        this.bin = bin;
    }
    _getEntityTable(name) {
        throw new Error("Method not implemented.");
    }
    _getTableByAlias(alias) {
        throw new Error("Method not implemented.");
    }
    _varPointer(name, isField) {
        if (isField !== true) {
            if (binVars.includes(name) === true) {
                return new il_1.VarPointer();
            }
        }
    }
}
class PBizPend extends Base_1.PBizEntity {
    constructor() {
        /*
        protected parseContent(): void {
            const keyColl = {
                prop: this.parseProp,
            };
            const keys = Object.keys(keyColl);
            for (; ;) {
                if (this.ts.token === Token.RBRACE) break;
                let parse = keyColl[this.ts.lowerVar];
                if (this.ts.varBrace === true || parse === undefined) {
                    this.ts.expect(...keys);
                }
                this.ts.readToken();
                parse();
            }
        }
        */
        super(...arguments);
        this.keyColl = (() => {
            let ret = {
                prop: this.parseProp,
            };
            const setRet = (n) => {
                ret[n] = () => this.parsePredefined(n);
            };
            il_1.BizPend.predefinedId.forEach(setRet);
            il_1.BizPend.predefinedValue.forEach(setRet);
            return ret;
        })();
    }
    parsePredefined(name) {
        let caption = this.ts.mayPassString();
        let bud = this.element.predefinedBuds[name];
        if (bud === undefined)
            debugger;
        // 有caption值，才会显示
        bud.caption = caption !== null && caption !== void 0 ? caption : name;
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    parseContent() {
        super.parseContent();
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        let { props } = this.element;
        const predefines = [...il_1.BizPend.predefinedId, ...il_1.BizPend.predefinedValue];
        for (let [, bud] of props) {
            if (predefines.includes(bud.name) === true) {
                this.log(`Pend Prop name can not be one of these: ${predefines.join(', ')}`);
                ok = false;
            }
        }
        /*
        for (let n of predefinedId) {
            props.set(n, new BizBudAtom(n, undefined));
        }
        for (let n of predefinedValue) {
            props.set(n, new BizBudDec(n, undefined));
        }
        */
        return ok;
    }
}
exports.PBizPend = PBizPend;
class PBizDetailAct extends Base_1.PBizBase {
    _parse() {
        this.element.name = '$';
        this.element.caption = this.ts.mayPassString();
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
            let field = new il_1.Field();
            field.parser(this.context).parse();
            this.element.idParam = field;
            if (field.dataType.type !== 'id') {
                this.ts.error(`${field.name} datatype must be ID`);
            }
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
        }
        else {
            let field = (0, il_1.bigIntField)('detailid');
            this.element.idParam = field;
        }
        let statement = new il_1.BizDetailActStatements(undefined, this.element);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context);
        parser.parse();
        this.element.statement = statement;
        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        //  will be removed
        let actSpace = new BizBinSpace(space, undefined);
        let { pelement } = this.element.statement;
        if (pelement.preScan(actSpace) === false)
            ok = false;
        if (pelement.scan(actSpace) === false)
            ok = false;
        /*
        if (this.fromPend !== undefined) {
            let pend = this.getBizEntity<BizPend>(space, this.fromPend, 'pend');
            if (pend === undefined) {
                ok = false;
            }
            else {
                this.element.fromPend = pend;
            }
        }
        */
        return ok;
    }
    scan2(uq) {
        if (this.element.statement.pelement.scan2(uq) === false) {
            return false;
        }
        return true;
    }
}
exports.PBizDetailAct = PBizDetailAct;
class PBizDetailActStatements extends statement_1.PStatements {
    constructor(statements, context, bizDetailAct) {
        super(statements, context);
        this.bizDetailAct = bizDetailAct;
    }
    statementFromKey(parent, key) {
        let ret;
        switch (key) {
            default:
                ret = super.statementFromKey(parent, key);
                break;
            case 'biz':
                ret = new il_1.BizDetailActStatement(parent, this.bizDetailAct);
                break;
        }
        if (ret !== undefined)
            ret.inSheet = true;
        return ret;
    }
}
exports.PBizDetailActStatements = PBizDetailActStatements;
exports.detailPreDefined = [
    '$site', '$user',
    'pend',
    'sheet', 'target',
    'detail',
    'i', 'x', 'value', 'amount', 'price'
];
class BizBinSpace extends space_1.Space {
    constructor(outer, bin) {
        super(outer);
        this.useColl = {}; // useStatement no
        this.bin = bin;
    }
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        if (exports.detailPreDefined.indexOf(name) >= 0) {
            return new il_1.VarPointer();
        }
    }
    _getBizEntity(name) {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                const { pend } = this.bin;
                return pend === null || pend === void 0 ? void 0 : pend.entity;
            case 'main':
                debugger;
                break;
        }
    }
    _getUse(name) {
        return this.useColl[name];
    }
    _addUse(name, statementNo, obj) {
        let v = this.useColl[name];
        if (v !== undefined)
            return false;
        this.useColl[name] = {
            statementNo,
            obj,
        };
        return true;
    }
}
//# sourceMappingURL=Sheet.js.map