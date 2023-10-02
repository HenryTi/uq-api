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
    }
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
            main: this.parseMain,
            detail: this.parseDetail,
        };
        const keys = Object.keys(keyColl);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
        }
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
            this.element.details.push({ detail, caption });
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
                this.ts.error(`PEND can only be defined once in Biz Detail`);
            }
            this.pend = this.ts.passVar();
            this.pendCaption = this.ts.mayPassString();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseI = () => {
            if (this.element.i !== undefined) {
                this.ts.error(`ITEM can only be defined once in Biz Detail`);
            }
            this.element.i = this.parseItemOut('i');
        };
        this.parseX = () => {
            if (this.element.x !== undefined) {
                this.ts.error(`ITEMX can only be defined once in Biz Detail`);
            }
            this.element.x = this.parseItemOut('x');
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
            let bizBinAct = new il_1.BizBinAct(this.element);
            this.element.act = bizBinAct;
            this.context.parseElement(bizBinAct);
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        };
    }
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
            i: this.parseI,
            x: this.parseX,
            value: this.parseValue,
            price: this.parsePrice,
            amount: this.parseAmount,
            act: this.parseAct,
            pend: this.parsePend,
        };
        const keys = Object.keys(keyColl);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
        }
    }
    parseItemOut(itemName) {
        let caption = this.ts.mayPassString();
        let exp;
        let act;
        let atom;
        let pick;
        if (this.ts.token === tokens_1.Token.EQU) {
            this.ts.readToken();
            act = il_1.BudValueAct.equ;
            exp = new il_1.ValueExpression();
            this.context.parseElement(exp);
        }
        else if (this.ts.token === tokens_1.Token.COLONEQU) {
            this.ts.readToken();
            act = il_1.BudValueAct.equ;
            exp = new il_1.ValueExpression();
            this.context.parseElement(exp);
        }
        else if (this.ts.isKeyword('atom') === true) {
            this.ts.readToken();
            this.ts.assertToken(tokens_1.Token.VAR);
            atom = this.ts.lowerVar;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('pick') === true) {
            this.ts.readToken();
            this.ts.assertToken(tokens_1.Token.VAR);
            pick = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            this.ts.expect('atom', 'pick');
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        let bud = new il_1.BizBudAtom(itemName, caption);
        if (exp !== undefined) {
            bud.value = {
                exp,
                act,
            };
        }
        return bud;
    }
    parseValueBud(bud, budName) {
        if (bud !== undefined) {
            this.ts.error(`${budName} can only define once`);
        }
        let caption = this.ts.mayPassString();
        let bizBud = this.parseBud(budName, caption);
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        return bizBud;
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        space = new DetailSpace(space, this.element);
        if (this.pend !== undefined) {
            let pend = this.getBizEntity(space, this.pend, il_1.BizPhraseType.pend);
            if (pend === undefined) {
                this.log(`PEND '${this.pend}' is not defined`);
                ok = false;
            }
            else {
                this.element.pend = {
                    caption: this.pendCaption,
                    entity: pend,
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
                if (value.exp.pelement.scan(space) === false) {
                    ok = false;
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
class PBizPend extends Base_1.PBizEntity {
    parseContent() {
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
            this.ts.assertToken(tokens_1.Token.VAR);
            if (this.ts.isKeyword('prop') === true) {
                this.ts.readToken();
            }
            this.parseProp();
        }
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
        let actSpace = new DetailSpace(space, undefined);
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
class DetailSpace extends space_1.Space {
    constructor(outer, detail) {
        super(outer);
        this.detail = detail;
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
                const { pend } = this.detail;
                return pend === null || pend === void 0 ? void 0 : pend.entity;
            case 'main':
                debugger;
                break;
        }
    }
}
//# sourceMappingURL=Sheet.js.map