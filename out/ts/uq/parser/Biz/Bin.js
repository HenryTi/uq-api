"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBinActStatements = exports.PBizBinAct = exports.detailPreDefined = exports.PPickInput = exports.PBinPick = exports.PBizBin = void 0;
const il_1 = require("../../il");
const il_2 = require("../../il");
const element_1 = require("../element");
const statement_1 = require("../statement");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
const Biz_1 = require("./Biz");
class PBizBin extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parsePick = () => {
            let name = this.ts.passVar();
            let ui = this.parseUI();
            let pick = new il_1.BinPick(this.element, name, ui);
            this.context.parseElement(pick);
            this.element.setPick(pick);
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
        };
    }
    parseValueBud(bud, budName) {
        if (bud !== undefined) {
            this.ts.error(`${budName} can only define once`);
        }
        let ui = this.parseUI();
        let bizBud = this.parseBud(budName, ui);
        if (this.ts.prevToken !== tokens_1.Token.RBRACE) {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
        return bizBud;
    }
    scan0(space) {
        let ok = true;
        const { pickArr, act } = this.element;
        for (let pick of pickArr) {
            if (pick.pelement.scan0(space) === false) {
                ok = false;
            }
        }
        if (pickArr !== undefined) {
            let { length } = pickArr;
            let end = length - 1;
            let pick = pickArr[end];
            if (pick.pick.bizEntityTable === undefined) {
                this.element.pickInput = pick.pick;
                end--;
            }
            if (end >= 0) {
                pick = pickArr[end];
                if (pick.pick.bizEntityTable === il_1.EnumSysTable.pend) {
                    let pend = pick.pick.from;
                    if (pend === undefined)
                        debugger;
                    this.element.pend = pend;
                    end--;
                }
            }
            this.pickPendPos = end;
        }
        if (act !== undefined) {
            if (act.pelement.scan0(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        space = new BizBinSpace(space, this.element);
        const { pickArr, i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (pickArr !== undefined) {
            let { length } = pickArr;
            for (let i = 0; i < length; i++) {
                let pick = pickArr[i];
                if (pick.pelement.scan(space) === false) {
                    ok = false;
                }
                if (i < this.pickPendPos) {
                    if (pick.single !== undefined) {
                        this.log(`Only last PICK can set SINGLE propertity`);
                        ok = false;
                    }
                    if (pick.pick.bizEntityTable === il_1.EnumSysTable.pend) {
                        this.log(`Only last PICK can be from PEND`);
                        ok = false;
                    }
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
            if (dataType !== il_2.BudDataType.dec && dataType !== il_2.BudDataType.none) {
                this.log(`${bud.getJName()} can only be DEC`);
                ok = false;
            }
            const { value } = bud;
            if (value !== undefined) {
                const { exp } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
            }
        };
        scanBudValue(budValue);
        scanBudValue(budAmount);
        scanBudValue(budPrice);
        if (super.scan(space) === false)
            ok = false;
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
        if (super.scan2(uq) === false) {
            ok = false;
        }
        return ok;
    }
    bizEntityScan2(bizEntity) {
        let ok = super.bizEntityScan2(bizEntity);
        let { i, x } = this.element;
        function check2(bizBud) {
            if (bizBud === undefined)
                return;
            let { pelement } = bizBud;
            if (pelement !== undefined) {
                if (pelement.bizEntityScan2(bizEntity) === false)
                    ok = false;
            }
        }
        check2(i);
        check2(x);
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
        if (this.ts.token === tokens_1.Token.LBRACE) {
            this.ts.readToken();
            let pickInput = new il_1.PickInput();
            this.element.pick = pickInput;
            this.context.parseElement(pickInput);
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
            return;
        }
        this.ts.passKey('from');
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
                    let bud;
                    if (this.ts.token === tokens_1.Token.MOD) {
                        this.ts.readToken();
                        bud = '%' + this.ts.passVar();
                    }
                    else {
                        bud = this.ts.passVar();
                    }
                    let prop;
                    if (this.ts.token === tokens_1.Token.DOT) {
                        this.ts.readToken();
                        prop = this.ts.passVar();
                    }
                    let { params } = this.element;
                    if (params === undefined) {
                        params = this.element.params = [];
                    }
                    params.push({
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
        if (this.ts.isKeyword('single') === true) {
            this.element.single = true;
            this.ts.readToken();
        }
        if (this.ts.prevToken !== tokens_1.Token.RBRACE) {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
        else {
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        }
    }
    scan0(space) {
        if (this.element.pick !== undefined)
            return true;
        let ok = true;
        const { biz } = space.uq;
        const { entityArr, logs, ok: retOk, bizPhraseType, } = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else {
            let pickBase;
            let multipleEntity = false;
            const bizEntity0 = entityArr[0];
            switch (bizPhraseType) {
                case il_2.BizPhraseType.atom:
                    pickBase = new il_1.PickAtom(entityArr);
                    multipleEntity = true;
                    break;
                case il_2.BizPhraseType.spec:
                    pickBase = new il_1.PickSpec(bizEntity0);
                    break;
                case il_2.BizPhraseType.pend:
                    pickBase = new il_1.PickPend(bizEntity0);
                    break;
                case il_2.BizPhraseType.query:
                    pickBase = new il_1.PickQuery(bizEntity0);
                    break;
            }
            this.element.pick = pickBase;
            if (multipleEntity === false && entityArr.length > 1) {
                this.log('from only one object');
                ok = false;
            }
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        const { biz } = space.uq;
        const { logs, ok: retOk } = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else {
            let { params, bin, pick: pickBase } = this.element;
            if (params !== undefined) {
                for (let p of params) {
                    const { name, bud, prop } = p;
                    if (pickBase.hasParam(name) === false) {
                        this.log(`PARAM ${name} is not defined`);
                        ok = false;
                    }
                    if (bud === '%sheet') {
                        const sheetProps = ['i', 'x', 'value', 'price', 'amount'];
                        if (prop === undefined || sheetProps.includes(prop) === true) {
                        }
                        else {
                            this.log(`%sheet. can be one of${sheetProps.join(',')}`);
                            ok = false;
                        }
                    }
                    else {
                        let pick = bin.getPick(bud);
                        if (pick === undefined) {
                            this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} ${bud} is not defined`);
                            ok = false;
                        }
                        else if (pick.pick.hasReturn(prop) === false) {
                            this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} ${prop} is not defined`);
                            ok = false;
                        }
                    }
                }
            }
        }
        return ok;
    }
}
exports.PBinPick = PBinPick;
class PPickInput extends element_1.PElement {
    _parse() {
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE) {
                this.ts.readToken();
                break;
            }
        }
    }
}
exports.PPickInput = PPickInput;
exports.detailPreDefined = [
    '$site', '$user',
    'bin', 'i', 'x',
    'value', 'amount', 'price',
    's', 'si', 'sx', 'svalue', 'sprice', 'samount', 'pend'
];
class BizBinSpace extends Biz_1.BizEntitySpace {
    constructor() {
        super(...arguments);
        this.useColl = {}; // useStatement no
    }
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        if (exports.detailPreDefined.indexOf(name) >= 0) {
            return new il_1.VarPointer();
        }
        if (this.bizEntity !== undefined) {
            let pick = this.bizEntity.getPick(name);
            if (pick !== undefined) {
                return new il_1.VarPointer();
            }
        }
    }
    _varsPointer(names) {
        if (this.bizEntity !== undefined) {
            let [pickName, pickProp] = names;
            let pick = this.bizEntity.getPick(pickName);
            if (pick === undefined) {
                return undefined;
            }
            if (pick.pick.hasReturn(pickProp) === false) {
                return [undefined, `Pick '${pickName}' has no return '${pickProp}'`];
            }
            return [new il_1.DotVarPointer(), undefined];
        }
    }
    _getBizEntity(name) {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                const { pend } = this.bizEntity;
                return pend;
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
    getBizFieldSpace() {
        return new il_1.BizBinActFieldSpace(this.bizEntity);
    }
}
class PBizBinAct extends Base_1.PBizBase {
    _parse() {
        this.element.name = '$';
        this.element.ui = this.parseUI();
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
        let statement = new il_1.BizBinActStatements(undefined, this.element);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context);
        parser.parse();
        this.element.statement = statement;
        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
    }
    scan0(space) {
        let ok = true;
        let { pelement } = this.element.statement;
        if (pelement.scan0(space) === false) {
            ok = false;
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        //  will be removed
        let actSpace = new BizBinSpace(space, this.element.bizBin);
        let { pelement } = this.element.statement;
        if (pelement.preScan(actSpace) === false)
            ok = false;
        if (pelement.scan(actSpace) === false)
            ok = false;
        return ok;
    }
    scan2(uq) {
        if (this.element.statement.pelement.scan2(uq) === false) {
            return false;
        }
        return true;
    }
}
exports.PBizBinAct = PBizBinAct;
class PBizBinActStatements extends statement_1.PStatements {
    constructor(statements, context, bizDetailAct) {
        super(statements, context);
        this.bizDetailAct = bizDetailAct;
    }
    scan0(space) {
        return super.scan0(space);
    }
    statementFromKey(parent, key) {
        let ret;
        switch (key) {
            default:
                ret = super.statementFromKey(parent, key);
                break;
            case 'biz':
                ret = new il_1.BizBinActStatement(parent, this.bizDetailAct);
                break;
        }
        if (ret !== undefined)
            ret.inSheet = true;
        return ret;
    }
}
exports.PBizBinActStatements = PBizBinActStatements;
//# sourceMappingURL=Bin.js.map