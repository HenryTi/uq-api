"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBinActStatements = exports.PBizBinAct = exports.binPreDefined = exports.PBizBin = void 0;
const consts_1 = require("../../../consts");
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const Base_1 = require("../Base");
const Biz_1 = require("../Biz");
class PBizBin extends Base_1.PBizEntity {
    constructor(element, context) {
        super(element, context);
        this.parseMain = () => {
            this.main = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parsePick = () => {
            let name = this.ts.passVar();
            this.parsePickProp(name);
        };
        this.parsePend = () => {
            this.parsePickProp('pend');
        };
        this.parseInput = () => {
            let name = this.ts.passVar();
            let ui = this.parseUI();
            let input;
            if (this.ts.isKeyword('spec') === true) {
                this.ts.readToken();
                input = new il_1.BinInputSpec(this.element, name, ui);
            }
            else if (this.ts.isKeyword('atom') === true) {
                this.ts.readToken();
                input = new il_1.BinInputAtom(this.element, name, ui);
            }
            else {
                this.ts.expect('SPEC', 'ATOM');
            }
            this.context.parseElement(input);
            this.element.setInput(input);
            this.div.inputs.push(input);
        };
        this.parseI = () => {
            let budKeyID = this.parseKeyID('i');
            if (budKeyID.dataType === il_1.BudDataType.none) {
                this.iBase = budKeyID;
                return;
            }
            if (this.element.i !== undefined) {
                this.ts.error(`I can only be defined once in Biz Bin`);
            }
            this.element.i = budKeyID;
        };
        this.parseX = () => {
            let budKeyID = this.parseKeyID('x');
            if (budKeyID.dataType === il_1.BudDataType.none) {
                this.xBase = budKeyID;
                return;
            }
            if (this.element.x !== undefined) {
                this.ts.error(`X can only be defined once in Biz Bin`);
            }
            this.element.x = budKeyID;
        };
        this.parseValue = () => {
            let bud = this.parseValueBud(this.element.value, consts_1.binValue, 'binValue');
            this.element.value = bud;
            this.div.buds.push(bud);
        };
        this.parsePrice = () => {
            let bud = this.parseValueBud(this.element.price, consts_1.binPrice);
            this.element.price = bud;
            this.div.buds.push(bud);
        };
        this.parseAmount = () => {
            let bud = this.parseValueBud(this.element.amount, consts_1.binAmount);
            this.element.amount = bud;
            this.div.buds.push(bud);
        };
        this.parsePivot = () => {
            const keyParse = {
                prop: this.parseBinProp,
                value: this.parseValue,
                amount: this.parseAmount,
            };
            this.parseDivOrPivot(keyParse);
            this.element.pivot = this.div;
        };
        this.parseDiv = () => {
            const keyParse = {
                input: this.parseInput,
                div: this.parseDiv,
                pivot: this.parsePivot,
                prop: this.parseBinProp,
                i: this.parseI,
                x: this.parseX,
                value: this.parseValue,
                price: this.parsePrice,
                amount: this.parseAmount,
            };
            this.parseDivOrPivot(keyParse);
        };
        this.parseBinProp = () => {
            let { group, budArr } = this.parseProp();
            if (group !== undefined && group.name !== '-') {
                this.ts.error(`Bin prop group should not have name`);
            }
            this.div.buds.push(...budArr);
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
            main: this.parseMain,
            pick: this.parsePick,
            pend: this.parsePend,
            input: this.parseInput,
            div: this.parseDiv,
            pivot: this.parsePivot,
            prop: this.parseBinProp,
            i: this.parseI,
            x: this.parseX,
            value: this.parseValue,
            price: this.parsePrice,
            amount: this.parseAmount,
            act: this.parseAct,
        };
        this.div = element.div;
        if (this.div === undefined)
            debugger;
    }
    parsePickProp(name) {
        let ui = this.parseUI();
        let pick = new il_1.BinPick(this.element, name, ui);
        this.context.parseElement(pick);
        this.element.setPick(pick);
    }
    parseKeyID(keyID) {
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            this.ts.passKey('base');
            let bud = new il_1.BizBudIDBase(this.element.biz, '.' + keyID, undefined);
            this.div.buds.push(bud);
            this.ts.passToken(tokens_1.Token.SEMICOLON);
            return bud;
        }
        else {
            let bud = this.parseBudAtom(keyID);
            this.div.buds.push(bud);
            return bud;
        }
    }
    parseValueBud(bud, budName, defaultType = 'dec') {
        if (bud !== undefined) {
            this.ts.error(`${budName} can only define once`);
        }
        let ui = this.parseUI();
        let bizBud = this.parseBud(budName, ui, defaultType);
        if (this.ts.prevToken !== tokens_1.Token.RBRACE) {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
        return bizBud;
    }
    parseDivOrPivot(keyParse) {
        if (this.div.div !== undefined) {
            this.ts.error(`duplicate DIV`);
        }
        if (this.div === this.element.pivot) {
            this.ts.error('can not define PIVOT or DIV in PIVOT');
        }
        let ui = this.parseUI();
        this.div = new il_1.BinDiv(this.div, ui);
        this.ts.passToken(tokens_1.Token.LBRACE);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE) {
                this.ts.readToken();
                this.div = this.div.parent;
                if (this.div === undefined)
                    this.div = this.element.div;
                break;
            }
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            let parse = keyParse[this.ts.lowerVar];
            if (parse === undefined) {
                this.ts.error(`Unknown ${this.ts._var}`);
            }
            this.ts.readToken();
            parse();
        }
    }
    scan0(space) {
        let ok = true;
        const { pickArr, inputArr, act } = this.element;
        if (pickArr !== undefined) {
            for (let pick of pickArr) {
                if (pick.pelement.scan0(space) === false) {
                    ok = false;
                }
            }
            let { length } = pickArr;
            let end = length - 1;
            if (end >= 0) {
                let { pick: pickBase } = pickArr[end];
                if (pickBase !== undefined && pickBase.bizEntityTable === il_1.EnumSysTable.pend) {
                    let pend = pickBase.from;
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
        let binSpace = new BizBinSpace(space, this.element);
        if (this.main !== undefined) {
            let m = binSpace.getBizEntity(this.main);
            if (m === undefined || m.bizPhraseType !== il_1.BizPhraseType.bin) {
                this.log(`${this.main} is not BIN`);
                ok = false;
            }
            else if (this.element.name === this.main) {
                this.log(`MAIN can not be self`);
                ok = false;
            }
            else {
                this.element.main = m;
            }
        }
        if (this.iBase !== undefined) {
            if (this.element.i === undefined) {
                this.log('i.base need I declare');
                ok = false;
            }
        }
        if (this.xBase !== undefined) {
            if (this.element.x === undefined) {
                this.log('x.base need X declare');
                ok = false;
            }
        }
        const { pickArr, inputArr, i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (pickArr !== undefined) {
            let { length } = pickArr;
            for (let i = 0; i < length; i++) {
                let pick = pickArr[i];
                if (pick.pelement.scan(binSpace) === false) {
                    ok = false;
                }
                if (i < this.pickPendPos) {
                    if (pick.single !== undefined) {
                        this.log(`Only last PICK can set SINGLE propertity`);
                        ok = false;
                    }
                    const { pick: pickBase } = pick;
                    if ((pickBase === null || pickBase === void 0 ? void 0 : pickBase.bizEntityTable) === il_1.EnumSysTable.pend) {
                        this.log(`Only last PICK can be from PEND`);
                        ok = false;
                    }
                }
            }
        }
        if (inputArr !== undefined) {
            for (let input of inputArr) {
                if (input.pelement.scan(binSpace) === false) {
                    ok = false;
                }
            }
        }
        if (i !== undefined) {
            if (this.scanBud(binSpace, i) === false) {
                ok = false;
            }
        }
        if (x !== undefined) {
            if (this.scanBud(binSpace, x) === false) {
                ok = false;
            }
        }
        const scanBudValue = (bud) => {
            if (bud === undefined)
                return;
            const { dataType } = bud;
            if (dataType !== il_1.BudDataType.dec && dataType !== il_1.BudDataType.none) {
                this.log(`${bud.getJName()} can only be DEC`);
                ok = false;
            }
            const { value, min, max } = bud;
            function scanValue(v) {
                if (v === undefined)
                    return;
                const { exp } = v;
                if (exp !== undefined) {
                    if (exp.pelement.scan(binSpace) === false) {
                        ok = false;
                    }
                }
            }
            scanValue(value);
            scanValue(min);
            scanValue(max);
        };
        scanBudValue(budValue);
        scanBudValue(budAmount);
        scanBudValue(budPrice);
        if (super.scan(binSpace) === false)
            ok = false;
        let { act } = this.element;
        if (act !== undefined) {
            if (act.pelement.scan(binSpace) === false) {
                ok = false;
            }
        }
        Object.assign(this.element.outs, binSpace.bizOuts);
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
exports.binPreDefined = [
    '$site', '$user',
    'bin',
    ,
    's', 'si', 'sx', 'svalue', 'sprice', 'samount', 'pend',
    ...consts_1.binFieldArr
];
class BizBinSpace extends Biz_1.BizEntitySpace {
    constructor() {
        super(...arguments);
        this.bizOuts = {};
    }
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        if (exports.binPreDefined.indexOf(name) >= 0) {
            return new il_1.VarPointer(name);
        }
        if (this.bizEntity.props.has(name) === true) {
            return new il_1.VarPointer(name);
        }
        let pick = this.bizEntity.pickColl[name];
        if (pick !== undefined) {
            return new il_1.VarPointer(name);
        }
        else {
            let input = this.bizEntity.inputColl[name];
            if (input !== undefined) {
                return new il_1.VarPointer(name);
            }
        }
    }
    _varsPointer(names) {
        let [pickName, pickProp] = names;
        let pick = this.bizEntity.pickColl[pickName];
        if (pick === undefined) {
            /*
            input only scalar
            let input = this.bizEntity.inputColl[pickName];
            if (input === undefined) {
                return undefined;
            }
            */
            return;
        }
        const { pick: pickBase } = pick;
        if (pickBase !== undefined && pickBase.hasReturn(pickProp) === false) {
            return [undefined, `Pick '${pickName}' has no return '${pickProp}'`];
        }
        return [new il_1.DotVarPointer(), undefined];
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
    getBizFieldSpace() {
        return new il_1.BizBinActFieldSpace(this.bizEntity);
    }
    _regUseBizOut(out, to) {
        let { name } = out;
        let bo = this.bizOuts[name];
        if (bo !== undefined && bo.to === true)
            to = true;
        let useOut = new il_1.UseOut(out, to);
        this.bizOuts[name] = useOut;
        return useOut;
    }
}
class BizBinActSpace extends Biz_1.BizEntitySpace {
    _varPointer(name, isField) {
        if (exports.binPreDefined.indexOf(name) >= 0) {
            return new il_1.VarPointer(name);
        }
    }
    _varsPointer(names) {
        return undefined;
    }
    _getBizEntity(name) {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                return;
        }
    }
    getBizFieldSpace() {
        return new il_1.BizBinActFieldSpace(this.bizEntity);
    }
}
class PBizBinAct extends Base_1.PBizAct {
    parseParam() {
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
    }
    createBizActStatements() {
        return new il_1.BizBinActStatements(undefined, this.element);
    }
    createBizActSpace(space) {
        return new BizBinActSpace(space, this.element.bizBin);
    }
}
exports.PBizBinAct = PBizBinAct;
class PBizBinActStatements extends Base_1.PBizActStatements {
    createBizActStatement(parent) {
        return new il_1.BizStatementBin(parent, this.bizAct);
    }
}
exports.PBizBinActStatements = PBizBinActStatements;
//# sourceMappingURL=Bin.js.map