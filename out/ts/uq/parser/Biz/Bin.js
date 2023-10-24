"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizDetailActStatements = exports.PBizDetailAct = exports.detailPreDefined = exports.PBizPend = exports.PBinPick = exports.PBizBin = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const space_1 = require("../space");
const statement_1 = require("../statement");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
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
        this.parsePick = () => {
            let { picks } = this.element;
            if (picks === undefined) {
                picks = new Map();
                this.element.picks = picks;
            }
            let name = this.ts.passVar();
            let caption = this.ts.mayPassString();
            let pick = new il_1.BinPick(this.element, name, caption);
            this.context.parseElement(pick);
            picks.set(pick.name, pick);
        };
        this.parseI = () => {
            if (this.element.i !== undefined) {
                this.ts.error(`I can only be defined once in Biz Bin`);
            }
            this.element.i = this.parseBudAtom('i');
        };
        this.parseX = () => {
            if (this.element.x !== undefined) {
                this.ts.error(`X can only be defined once in Biz Bin`);
            }
            this.element.x = this.parseBudAtom('x');
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
            pick: this.parsePick,
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
    parseBudAtom(itemName) {
        let caption = this.ts.mayPassString();
        let bud = new il_1.BizBudAtom(this.element.biz, itemName, caption);
        if (this.ts.isKeyword('pick') === true) {
            this.ts.readToken();
        }
        this.context.parseElement(bud);
        this.parseBudEqu(bud);
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
        // let binSpace = new BinSpace(space, this.element);
        space = new BizBinSpace(space, this.element);
        if (super.scan(space) === false)
            ok = false;
        const { picks, i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (this.pend !== undefined) {
            let pend = this.getBizEntity(space, this.pend, il_1.BizPhraseType.pend);
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
        if (picks !== undefined) {
            for (let [, pick] of picks) {
                if (pick.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
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
class PBinPick extends element_1.PElement {
    constructor() {
        super(...arguments);
        this.from = [];
    }
    _parse() {
        this.ts.passKey('from');
        let param = [];
        this.element.param = param;
        for (;;) {
            this.from.push(this.ts.passVar());
            if (this.ts.token !== tokens_1.Token.BITWISEOR)
                break;
            this.ts.readToken();
        }
        if (this.ts.token === tokens_1.Token.LBRACE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RBRACE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.isKeyword('param') === true) {
                    this.ts.readToken();
                    let name = this.ts.passVar();
                    this.ts.passToken(tokens_1.Token.EQU);
                    let bud = this.ts.passVar();
                    let prop;
                    if (this.ts.token === tokens_1.Token.DOT) {
                        this.ts.readToken();
                        prop = this.ts.passVar();
                    }
                    param.push({
                        name,
                        bud,
                        prop,
                    });
                }
                else {
                    this.ts.expect('param');
                }
                this.ts.passToken(tokens_1.Token.SEMICOLON);
            }
        }
        if (this.ts.prevToken !== tokens_1.Token.RBRACE) {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
    }
    scan(space) {
        let ok = true;
        const { biz } = space.uq;
        const { entityArr, logs, bizEntity0, ok: retOk, bizPhraseType, } = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else {
            let pickBase;
            switch (bizPhraseType) {
                case il_1.BizPhraseType.atom:
                    pickBase = new il_1.PickAtom(entityArr);
                    break;
                case il_1.BizPhraseType.spec:
                    pickBase = new il_1.PickSpec(bizEntity0);
                    break;
                case il_1.BizPhraseType.pend:
                    pickBase = new il_1.PickPend(bizEntity0);
                    break;
                case il_1.BizPhraseType.query:
                    pickBase = new il_1.PickQuery(bizEntity0);
                    break;
            }
            let { param } = this.element;
            for (let p of param) {
                const { name, bud, prop } = p;
                if (pickBase.hasParam(name) === false) {
                    this.log(`PARAM ${name} is not defined`);
                    ok = false;
                }
                if (this.element.bin.isValidPickProp(bud, prop) === false) {
                    this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} is not valid`);
                    ok = false;
                }
            }
            this.element.pick = pickBase;
        }
        return ok;
    }
}
exports.PBinPick = PBinPick;
/*
const binVars = [
    'bin', 'i', 'x'
    , 'value', 'amount', 'price'
    , 's', 'si', 'sx', 'svalue', 'sprice', 'samount', 'pend'
];
class BinSpace extends Space {
    private readonly bin: BizBin;
    constructor(outerSpace: Space, bin: BizBin) {
        super(outerSpace);
        this.bin = bin;
    }
    protected _getEntityTable(name: string): Entity & Table {
        throw new Error("Method not implemented.");
    }
    protected _getTableByAlias(alias: string): Table {
        throw new Error("Method not implemented.");
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (isField !== true) {
            if (binVars.includes(name) === true) {
                return new VarPointer();
            }
        }
    }
    protected _varsPointer(names: string[]): Pointer {
        if (this.bin.isValidPickProp(names[0], names[1]) === true) {
            return new VarPointer();
        }
    }
}
*/
class PBizPend extends Base_1.PBizEntity {
    constructor() {
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
        return ok;
    }
}
exports.PBizPend = PBizPend;
exports.detailPreDefined = [
    '$site', '$user',
    'bin', 'i', 'x',
    'value', 'amount', 'price',
    's', 'si', 'sx', 'svalue', 'sprice', 'samount', 'pend'
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
        var _a;
        if (exports.detailPreDefined.indexOf(name) >= 0) {
            return new il_1.VarPointer();
        }
        if (this.bin !== undefined) {
            let pick = (_a = this.bin.picks) === null || _a === void 0 ? void 0 : _a.get(name);
            if (pick !== undefined) {
                return new il_1.VarPointer();
            }
        }
    }
    _varsPointer(names) {
        if (this.bin !== undefined) {
            if (this.bin.isValidPickProp(names[0], names[1]) === true) {
                return new il_1.VarPointer();
            }
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
//# sourceMappingURL=Bin.js.map