"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizDetailActStatements = exports.PBizDetailAct = exports.PBizPend = exports.PBizDetail = exports.PBizMain = exports.PBizSheet = void 0;
const il_1 = require("../../il");
const space_1 = require("../space");
const statement_1 = require("../statement");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizSheet extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.defaultName = undefined;
        this.details = [];
        this.parseMain = () => {
            if (this.main !== undefined) {
                this.ts.error(`main can only be defined once in Biz Sheet`);
            }
            this.main = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseDetail = () => {
            let detail = this.ts.passVar();
            let act = undefined;
            if (this.ts.isKeyword('act') === true) {
                this.ts.readToken();
                act = this.ts.passVar();
            }
            this.details.push({ detail, act });
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
        let main = this.getBizEntity(space, this.main, 'main');
        if (main === undefined) {
            ok = false;
        }
        else {
            this.element.main = main;
        }
        const sheetActs = {};
        const fromPends = {};
        const checkSheetAct = (detail, act) => {
            let sheetActName = detail.name;
            // let fromPendName: string;
            if (act !== undefined) {
                sheetActName += '.' + act.name;
                /*
                let { fromPend } = act;
                if (fromPend === undefined) {
                    fromPendName = '$';
                }
                else {
                    fromPendName = fromPend.name;
                }
                */
            }
            else {
                // fromPendName = '$';
            }
            /*
            let pend = fromPends[fromPendName];
            if (pend !== undefined) {
                if (fromPendName === '$') {
                    this.log(`Sheet ${this.element.name} has duplicate from pend ${fromPendName}`);
                }
                else {
                    this.log(`Sheet ${this.element.name} has duplicate detail ${detail.name}`);
                }
                return false;
            }
            */
            let sheetAct = sheetActs[sheetActName];
            if (sheetAct === undefined) {
                sheetActs[sheetActName] = { detail, act };
                return true;
            }
            this.log(`Detail ${sheetActName} can not duplicate`);
            return false;
        };
        for (let { detail: detailName, act: actName } of this.details) {
            let detail = this.getBizEntity(space, detailName, 'detail');
            if (detail === undefined) {
                ok = false;
                continue;
            }
            let { acts } = detail;
            if (actName === undefined) {
                if (acts.length === 0) {
                    if (checkSheetAct(detail, undefined) === false)
                        ok = false;
                    continue;
                }
                actName = '$';
            }
            let act = acts.find(v => v.name === actName);
            if (act === undefined) {
                this.log(`${actName} is not an ACT of Biz Detail ${detail.name}`);
                ok = false;
            }
            else {
                this.element.acts.push(act);
            }
            if (checkSheetAct(detail, act) === false)
                ok = false;
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        /*
        const pends: { [pendName: string]: boolean } = {};
        for (let act of this.element.acts) {
            let { name: actName, fromPend, bizDetail } = act;
            let { name: detailName } = bizDetail;
            let pendName: string;
            let logError: () => string;
            if (fromPend === undefined) {
                pendName = '$';
                logError = () => {
                    return `Detail Act '${detailName}.${actName}' does not have FromPend. Sheet can have only one none pend detail act`;
                }
            }
            else {
                pendName = fromPend.name;
                logError = () => {
                    return `Detail Act '${detailName}.${actName}' has a pending '${pendName}', which is duplicated`
                }
            }
            if (pends[pendName] === true) {
                this.log(logError());
                ok = false;
            }
            else {
                pends[pendName] = true;
            }
        }
        */
        return ok;
    }
}
exports.PBizSheet = PBizSheet;
class PBizMain extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.defaultName = undefined;
        this.parseTarget = () => {
            const cTarget = 'target';
            if (this.element.target !== undefined) {
                this.ts.error('target can only define once');
            }
            let caption = this.ts.mayPassString();
            let bizBud = this.parseBud(cTarget, cTarget, caption);
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
            if (target.dataType !== 'atom') {
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
        this.defaultName = undefined;
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
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseItem = () => {
            if (this.element.item !== undefined) {
                this.ts.error(`ITEM can only be defined once in Biz Detail`);
            }
            const cItem = 'item';
            let caption = this.ts.mayPassString();
            let bizBud = this.parseBud(cItem, cItem, caption);
            this.element.item = bizBud;
            this.ts.passToken(tokens_1.Token.SEMICOLON);
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
    parseValueBud(bud, budName) {
        if (bud !== undefined) {
            this.ts.error(`${budName} can only define once`);
        }
        let caption = this.ts.mayPassString();
        let bizBud = this.parseBud(budName, budName, caption);
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        return bizBud;
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        if (this.main === undefined) {
            this.log(`Biz Detail must define main`);
            ok = false;
        }
        let main = this.getBizEntity(space, this.main, 'main');
        if (main === undefined) {
            this.log(`MAIN '${this.main}' is not defined`);
            ok = false;
        }
        else {
            this.element.main = main;
        }
        if (this.pend !== undefined) {
            let pend = this.getBizEntity(space, this.pend, 'pend');
            if (pend === undefined) {
                this.log(`PEND '${this.pend}' is not defined`);
                ok = false;
            }
            else {
                this.element.pend = pend;
            }
        }
        const { item, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (item !== undefined) {
            if (this.scanBud(space, item) === false) {
                ok = false;
            }
            if (item.dataType !== 'atom') {
                this.log('item can only be ATOM');
                ok = false;
            }
            const itemBud = item;
            let { atom } = itemBud;
            if (atom !== undefined) {
                const { uom } = atom;
                if (uom === undefined) {
                    this.log(`ATOM '${atom.name}' does not define UOM, can not be used in DETAIL`);
                    ok = false;
                }
            }
        }
        function scanBudValue(bud) {
            if (bud === undefined)
                return;
            if (bud.dataType !== 'dec') {
                this.log(`${bud.jName} can only be DEC`);
                ok = false;
            }
        }
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
}
exports.PBizDetail = PBizDetail;
class PBizPend extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.defaultName = undefined;
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
    constructor() {
        super(...arguments);
        this.defaultName = undefined;
    }
    // private fromPend: string;
    _parse() {
        /*
        if (this.ts.token === Token.VAR) {
            this.element.name = this.ts.passVar();
        }
        else {
            this.element.name = '$';
        }
        */
        this.element.name = '$';
        this.element.caption = this.ts.mayPassString();
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        let field = new il_1.Field();
        field.parser(this.context).parse();
        this.element.idParam = field;
        if (field.dataType.type !== 'id') {
            this.ts.error(`${field.name} datatype must be ID`);
        }
        this.ts.passToken(tokens_1.Token.RPARENTHESE);
        /*
        if (this.ts.isKeyword('from') === true) {
            this.ts.readToken();
            this.fromPend = this.ts.passVar();
        }
        */
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
        let actSpace = new DetailActSpace(space, this.element);
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
    // private readonly bizDetailAct: BizDetailAct;
    constructor(statements, context, bizDetailAct) {
        super(statements, context);
        // this.bizDetailAct = bizDetailAct;
    }
    statementFromKey(parent, key) {
        let ret;
        switch (key) {
            default:
                ret = super.statementFromKey(parent, key);
                break;
            case 'biz':
                ret = new il_1.BizDetailActStatement(parent /*, this.bizDetailAct*/);
                break;
        }
        if (ret !== undefined)
            ret.inSheet = true;
        return ret;
    }
}
exports.PBizDetailActStatements = PBizDetailActStatements;
const dollarVars = ['$site', '$user'];
class DetailActSpace extends space_1.Space {
    constructor(outer, act) {
        super(outer);
        this.act = act;
    }
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        let { idParam } = this.act;
        if (name === idParam.name) {
            return new il_1.VarPointer();
        }
        if (dollarVars.indexOf(name) >= 0) {
            return new il_1.VarPointer();
        }
    }
    _getBizBase(bizName) {
        try {
            return this.act.bizDetail.getBizBase(bizName);
        }
        catch (_a) {
            return;
        }
    }
    addTableVar(tableVar) {
        return this.act.addTableVar(tableVar);
    }
    getTableVar(name) {
        var _a;
        return (_a = this.act) === null || _a === void 0 ? void 0 : _a.getTableVar(name);
    }
}
//# sourceMappingURL=Sheet.js.map