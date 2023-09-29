"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detailPreDefined = exports.PBizDetailActStatements = exports.PBizDetailAct = exports.PBizPend = exports.PBizDetail = exports.PBizMain = exports.PBizSheet = void 0;
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
        let main = this.getBizEntity(space, this.main, il_1.BizPhraseType.main);
        if (main === undefined) {
            this.log(`MAIN ${this.main} is not defined`);
            ok = false;
        }
        else {
            this.element.main = main;
        }
        for (let { name, caption } of this.details) {
            let detail = this.getBizEntity(space, name, il_1.BizPhraseType.detail);
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
class PBizMain extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseTarget = () => {
            const cTarget = 'target';
            if (this.element.target !== undefined) {
                this.ts.error('target can only define once');
            }
            let caption = this.ts.mayPassString();
            let bizBud = this.parseBud(cTarget, caption);
            this.element.target = bizBud;
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
    }
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
            target: this.parseTarget,
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
        const { target } = this.element;
        if (target !== undefined) {
            if (target.dataType !== il_1.BudDataType.atom) {
                this.log('target can only be ATOM');
                ok = false;
            }
            if (this.scanBud(space, target) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PBizMain = PBizMain;
class PBizDetail extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseMain = () => {
            if (this.main !== undefined) {
                this.ts.error(`MAIN can only be defined once in Biz Detail`);
            }
            this.main = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parsePend = () => {
            if (this.pend !== undefined) {
                this.ts.error(`PEND can only be defined once in Biz Detail`);
            }
            this.pend = this.ts.passVar();
            this.pendCaption = this.ts.mayPassString();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseItem = () => {
            if (this.element.item !== undefined) {
                this.ts.error(`ITEM can only be defined once in Biz Detail`);
            }
            this.element.item = this.parseItemOut();
        };
        this.parseItemX = () => {
            if (this.element.itemX !== undefined) {
                this.ts.error(`ITEMX can only be defined once in Biz Detail`);
            }
            this.element.itemX = this.parseItemOut();
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
            const { acts } = this.element;
            if (acts.length > 0) {
                this.ts.error('ACT can only be defined once');
            }
            let bizDetailAct = new il_1.BizDetailAct(this.element);
            this.element.acts.push(bizDetailAct);
            this.context.parseElement(bizDetailAct);
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        };
    }
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
            main: this.parseMain,
            item: this.parseItem,
            itemx: this.parseItemX,
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
    parseItemOut() {
        let caption = this.ts.mayPassString();
        let atom;
        let pick;
        if (this.ts.isKeyword('atom') === true) {
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
        let item = {
            caption,
            atom,
            pick,
        };
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        return item;
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
        space = new DetailSpace(space);
        if (this.main === undefined) {
            this.log(`Biz Detail must define main`);
            ok = false;
        }
        let main = this.getBizEntity(space, this.main, il_1.BizPhraseType.main);
        if (main === undefined) {
            this.log(`MAIN '${this.main}' is not defined`);
            ok = false;
        }
        else {
            this.element.main = main;
        }
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
        const { item, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (item !== undefined) {
            const { atom, pick } = item;
            if (atom !== undefined) {
                let entity = this.getBizEntity(space, atom);
                if (entity === undefined || entity.bizPhraseType !== il_1.BizPhraseType.atom) {
                    this.ts.log(`${atom} is not BizAtom`);
                    ok = false;
                }
            }
            else if (pick !== undefined) {
                let entity = this.getBizEntity(space, pick);
                if (entity === undefined || [il_1.BizPhraseType.pick, il_1.BizPhraseType.atom].indexOf(entity.bizPhraseType) < 0) {
                    this.ts.log(`${pick} is neither BizPick nor BizAtom `);
                    ok = false;
                }
            }
        }
        const scanBudValue = (bud) => {
            if (bud === undefined)
                return;
            if (bud.dataType !== il_1.BudDataType.dec) {
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
        let { acts } = this.element;
        for (let act of acts) {
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
exports.PBizDetail = PBizDetail;
class PBizPend extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseDetail = () => {
            if (this.detail !== undefined) {
                this.ts.error(`detail can only be defined once in Biz Pend`);
            }
            this.detail = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
    }
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
            // assign: this.parseAssign,
            // detail: this.parseDetail,
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
        /*
        if (this.detail === undefined) {
            this.log(`Biz Detail must define detail`);
            ok = false;
        }
        let detail = this.getBizEntity<BizDetail>(space, this.detail, 'detail');
        if (detail === undefined) {
            ok = false;
        }
        else {
            this.element.detail = detail;
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
        let actSpace = new DetailSpace(space);
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
    'target', 'item', 'itemx', 'value', 'amount', 'price'
];
class DetailSpace extends space_1.Space {
    /*
    private readonly act: BizDetailAct;
    constructor(outer: Space, act: BizDetailAct) {
        super(outer);
        this.act = act;
    }
    */
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        /*
        let { idParam } = this.act;
        if (name === idParam.name) {
            return new VarPointer();
        }
        */
        if (exports.detailPreDefined.indexOf(name) >= 0) {
            return new il_1.VarPointer();
        }
    }
}
//# sourceMappingURL=Sheet.js.map