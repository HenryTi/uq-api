"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBinActStatements = exports.PBizBinAct = exports.BizBinSpace = exports.binPreDefined = exports.PBizBin = exports.PBizBinBase = void 0;
const consts_1 = require("../../../consts");
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const tokens_1 = require("../../tokens");
const Base_1 = require("../Base");
const Biz_1 = require("../Biz");
var EnumIX;
(function (EnumIX) {
    EnumIX[EnumIX["i"] = 0] = "i";
    EnumIX[EnumIX["x"] = 1] = "x";
})(EnumIX || (EnumIX = {}));
class PBizBinBase extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseAct = () => {
            const { act } = this.element;
            if (act !== undefined) {
                this.ts.error('ACT can only be defined once');
            }
            let bizBinAct = this.createBizBinBaseAct();
            this.element.act = bizBinAct;
            this.context.parseElement(bizBinAct);
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        };
    }
}
exports.PBizBinBase = PBizBinBase;
class PBizBin extends PBizBinBase {
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
            if (this.ts.isKeywords('spec', 'fork') === true) {
                this.ts.readToken();
                input = new il_1.BinInputFork(this.element, name, ui);
            }
            else if (this.ts.isKeyword('atom') === true) {
                this.ts.readToken();
                input = new il_1.BinInputAtom(this.element, name, ui);
            }
            else {
                this.ts.expect('FORK', 'SPEC', 'ATOM');
            }
            this.context.parseElement(input);
            this.element.setInput(input);
            this.div.inputs.push(input);
        };
        this.parseI = () => {
            if (this.ts.token === tokens_1.Token.DOT) {
                let budKeyID = this.parseIXIDBase(EnumIX.i);
                if (this.element.iBase !== undefined) {
                    this.ts.error(`I.BASE can only be defined once in Biz Bin`);
                }
                this.element.iBase = budKeyID;
                return;
            }
            let budKeyID = this.parseIXID(EnumIX.i);
            if (this.element.i !== undefined) {
                this.ts.error(`I can only be defined once in Biz Bin`);
            }
            this.element.i = budKeyID;
        };
        this.parseX = () => {
            if (this.ts.token === tokens_1.Token.DOT) {
                let budKeyID = this.parseIXIDBase(EnumIX.x);
                if (this.element.xBase !== undefined) {
                    this.ts.error(`X.BASE can only be defined once in Biz Bin`);
                }
                this.element.xBase = budKeyID;
                return;
            }
            let budKeyID = this.parseIXID(EnumIX.x);
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
                key: this.parsePivotKey,
                prop: this.parseBinProp,
                value: this.parseValue,
                amount: this.parseAmount,
                format: this.parsePivotFormat,
            };
            this.parseDivOrPivot(keyParse, il_1.BinPivot);
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
            this.parseDivOrPivot(keyParse, il_1.BinDiv);
        };
        this.parseBinProp = () => {
            let { group, budArr } = this.parseProp();
            if (group !== undefined && group.name !== '-') {
                this.ts.error(`Bin prop group should not have name`);
            }
            this.div.buds.push(...budArr);
        };
        this.parsePivotKey = () => {
            let { group, budArr } = this.parseProp();
            if (group !== undefined || budArr.length > 1) {
                this.ts.error(`Pivot only one KEY`);
            }
            let key = budArr[0];
            let { ui } = key;
            if (ui === undefined) {
                ui = { required: true };
            }
            else {
                ui.required = true;
            }
            key.required = true;
            this.div.buds.push(key);
            this.div.key = key;
        };
        this.parsePivotFormat = () => {
            let pivotFormat = this.div.pivotFormat = [];
            for (;;) {
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                let bud = this.ts.lowerVar;
                this.ts.readToken();
                let withLabel;
                if (this.ts.token === tokens_1.Token.BITWISEAND) {
                    withLabel = true;
                    this.ts.readToken();
                }
                else {
                    withLabel = false;
                }
                let exclude;
                if (this.ts.token === tokens_1.Token.Exclamation) {
                    this.ts.readToken();
                    if (this.ts.token !== tokens_1.Token.VAR) {
                        this.ts.expectToken(tokens_1.Token.VAR);
                    }
                    exclude = this.ts.lowerVar;
                    this.ts.readToken();
                }
                pivotFormat.push([bud, withLabel, exclude]);
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === tokens_1.Token.SEMICOLON) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(tokens_1.Token.SEMICOLON, tokens_1.Token.COMMA);
            }
        };
        this.parseColonBuds = () => {
            this.parsePrimeBuds();
        };
        this.keyColl = {
            ':': this.parseColonBuds,
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
    createBizBinBaseAct() {
        return new il_1.BizBinAct(this.element.biz, this.element);
    }
    parsePickProp(name) {
        let ui = this.parseUI();
        let pick = new il_1.BinPick(this.element, name, ui);
        this.context.parseElement(pick);
        this.element.setPick(pick);
    }
    parseIXID(IX) {
        let bud = this.parseBudAtom(EnumIX[IX]);
        this.div.buds.push(bud);
        return bud;
    }
    parseIXIDBase(IX) {
        this.ts.readToken();
        this.ts.passKey('base');
        let nameIX = EnumIX[IX];
        let bud = new il_1.BizBudIXBase(this.element, nameIX + 'base', undefined);
        this.context.parseElement(bud);
        const { value } = bud;
        if ((value === null || value === void 0 ? void 0 : value.setType) !== il_1.BudValueSetType.equ) {
            // 如果本来pend.id就是批次，也就不需要=
            // this.ts.error(`${nameIX}.BASE must set value`);
        }
        this.div.buds.push(bud);
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        return bud;
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
    parseDivOrPivot(keyParse, BinDivNew) {
        if (this.div.div !== undefined) {
            this.ts.error(`duplicate DIV`);
        }
        if (this.div === this.element.pivot) {
            this.ts.error('can not define PIVOT or DIV in PIVOT');
        }
        let ui = this.parseUI();
        this.div = new BinDivNew(this.div, ui);
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
    parsePrimeBuds() {
        this.primeBuds = this.parseBudNameArr();
    }
    scan0(space) {
        let ok = super.scan0(space);
        const { pickArr, act } = this.element;
        this.element.buildPredefinedBuds();
        if (pickArr !== undefined) {
            for (let pick of pickArr) {
                if (pick.pelement.scan0(space) === false) {
                    ok = false;
                }
            }
            let { length } = pickArr;
            let end = length;
            if (end >= 1) {
                let { pick: pickBase } = pickArr[end - 1];
                if (pickBase !== undefined && pickBase.bizPhraseType === BizPhraseType_1.BizPhraseType.pend) {
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
        let binSpace = new BizBinSpace(space, this.element);
        if (this.main !== undefined) {
            let { bizEntityArr: [m] } = binSpace.getBizFromEntityArrFromName(this.main);
            if (m === undefined || m.bizPhraseType !== BizPhraseType_1.BizPhraseType.bin) {
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
        return ok;
    }
    scan(space) {
        let ok = true;
        const { pend, main } = this.element;
        if (pend === undefined) {
            if (main !== undefined) {
                this.element.pend = main.pend;
            }
        }
        let binSpace = new BizBinSpace(space, this.element);
        const { iBase, xBase } = this.element;
        if (iBase !== undefined) {
            if (this.element.i === undefined) {
                this.log('i.base need I declare');
                ok = false;
            }
            if (this.scanBud(binSpace, iBase) === false) {
                ok = false;
            }
        }
        if (xBase !== undefined) {
            if (this.element.x === undefined) {
                this.log('x.base need X declare');
                ok = false;
            }
            if (this.scanBud(binSpace, xBase) === false) {
                ok = false;
            }
        }
        const { pickArr, inputArr, i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
        if (pickArr !== undefined) {
            let { length } = pickArr;
            for (let i = 0; i < length; i++) {
                let pick = pickArr[i];
                if (pick.name === undefined)
                    pick.name = '$pick' + i;
                if (pick.pelement.scan(binSpace) === false) {
                    ok = false;
                }
                if (i < this.pickPendPos) {
                    if (pick.single !== undefined) {
                        this.log(`Only last PICK can set SINGLE propertity`);
                        ok = false;
                    }
                    const { pick: pickBase } = pick;
                    if ((pickBase === null || pickBase === void 0 ? void 0 : pickBase.bizPhraseType) === BizPhraseType_1.BizPhraseType.pend) {
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
            if (dataType !== BizPhraseType_1.BudDataType.dec && dataType !== BizPhraseType_1.BudDataType.none) {
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
        this.scanPrimeBuds();
        return ok;
    }
    scanPrimeBuds() {
        let ok = true;
        if (this.primeBuds !== undefined) {
            let ret = this.scanBudNameArr(this.primeBuds);
            if (ret === null) {
                ok = false;
            }
            else if (ret !== undefined) {
                let primeBuds = this.element.primeBuds = ret;
                for (let bud of primeBuds)
                    bud.show = true;
                return ret;
            }
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        if (super.scan2(uq) === false) {
            ok = false;
        }
        let { div, i, x, iBase, xBase, pickArr } = this.element;
        for (; div !== undefined; div = div.div) {
            let { pivotFormat: format } = div;
            if (format === undefined)
                continue;
            let nf = [];
            for (let [budName, withLabel, exclude] of format) {
                let bud = this.element.getBud(budName);
                if (bud === undefined) {
                    ok = false;
                    this.log(`FORMAT ${bud} not exists`);
                    continue;
                }
                let itemExclude;
                if (bud.dataType === BizPhraseType_1.BudDataType.radio && exclude !== undefined) {
                    let { options } = bud;
                    itemExclude = options.items.find(v => v.name === exclude || v.itemValue === exclude);
                    if (itemExclude === undefined) {
                        ok = false;
                        this.log(`FORMAT !${exclude} not exists`);
                    }
                }
                nf.push([bud, withLabel, itemExclude]);
            }
            div.pivotFormat = nf;
        }
        if (i !== undefined) {
            const { ID } = i;
            if (ID !== undefined) {
                if (ID.bizPhraseType === BizPhraseType_1.BizPhraseType.fork) {
                    if (iBase === undefined) {
                        // 不一定需要I.Base
                        // ok = false;
                        // this.log('I Spec need I.base');
                    }
                }
            }
        }
        if (x !== undefined) {
            const { ID } = x;
            if (ID !== undefined) {
                if (ID.bizPhraseType === BizPhraseType_1.BizPhraseType.fork) {
                    if (xBase === undefined) {
                        // ok = false;
                        // this.log('X Spec need X.base');
                    }
                }
            }
        }
        if (pickArr !== undefined) {
            for (let pick of pickArr) {
                if (pick.pelement.scan2(uq) === false) {
                    ok = false;
                }
            }
        }
        // check bud fork and query bound
        let budBound;
        for (let [, bud] of this.element.props) {
            const { dataType, value } = bud;
            if ((value === null || value === void 0 ? void 0 : value.setType) === il_1.BudValueSetType.bound) {
                if (budBound !== undefined) {
                    ok = false;
                    this.log(`QUERY bound :: 只能有一个`);
                }
                else {
                    if (this.scanBudBound(bud) === false)
                        ok = false;
                }
                budBound = bud;
            }
            if (dataType !== BizPhraseType_1.BudDataType.fork)
                continue;
            let budFork = bud;
            const { baseBudName } = budFork;
            if (baseBudName !== undefined) {
                let baseBud;
                switch (baseBudName) {
                    default:
                        baseBud = this.element.props.get(baseBudName);
                        break;
                    case 'i':
                        baseBud = this.element.i;
                        break;
                    case 'x':
                        baseBud = this.element.x;
                        break;
                }
                if (baseBud === undefined) {
                    ok = false;
                    this.log(`FORK BASE ${baseBudName} not defined`);
                }
                else {
                    budFork.baseBud = baseBud;
                }
            }
        }
        return ok;
    }
    scanBudBound(bud) {
        const { dataType } = bud;
        let jName = bud.getJName();
        switch (dataType) {
            case BizPhraseType_1.BudDataType.atom:
            case BizPhraseType_1.BudDataType.ID:
            case BizPhraseType_1.BudDataType.bin:
                break;
            default:
                this.log(`${jName} 不是ID字段，不能::bound`);
                return false;
        }
        const { value } = bud;
        if (value !== undefined) {
            //let {scalarValue} = value.exp;//.getBud();
            let vBud = this.getBoundBud(value.exp);
            if (vBud === undefined) {
                this.log(`${jName} 只能bound Pick 的ID字段`);
                return false;
            }
        }
        return true;
    }
    getBoundBud(exp) {
        const { scalarValue } = exp;
        if (scalarValue === undefined)
            return undefined;
        if (Array.isArray(scalarValue) === false)
            return undefined;
        if (scalarValue.length !== 2)
            return undefined;
        const [pickName, fieldName] = scalarValue;
        const { pickArr } = this.element;
        if (pickArr === undefined)
            return undefined;
        let rearPick = pickArr[pickArr.length - 1];
        if (pickName !== rearPick.name)
            return undefined;
        let pBud = rearPick.pick.getBud(fieldName);
        if (pBud === undefined)
            return undefined;
        switch (pBud.dataType) {
            default: return undefined;
            case BizPhraseType_1.BudDataType.atom:
            case BizPhraseType_1.BudDataType.ID:
            case BizPhraseType_1.BudDataType.bin:
                return pBud;
        }
    }
    bizEntityScan2(bizEntity) {
        let ok = super.bizEntityScan2(bizEntity);
        let { i, x, iBase, xBase } = this.element;
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
        check2(iBase);
        check2(x);
        check2(xBase);
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
    constructor(outer, bizBin) {
        super(outer, bizBin);
        this.bizOuts = {};
        this.bizFieldSpace = new il_1.BizBinActFieldSpace(bizBin);
    }
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        if (exports.binPreDefined.indexOf(name) >= 0) {
            switch (name) {
                default: break;
                case 'ibase':
                    if (this.bizEntity.iBase === undefined)
                        return;
                    break;
                case 'xbase':
                    if (this.bizEntity.xBase === undefined)
                        return;
                    break;
            }
            return new il_1.NamePointer(name);
        }
        if (this.bizEntity.props.has(name) === true) {
            return new il_1.NamePointer(name);
        }
        let pick = this.bizEntity.pickColl[name];
        if (pick !== undefined) {
            return new il_1.NamePointer(name);
        }
        else {
            let input = this.bizEntity.inputColl[name];
            if (input !== undefined) {
                return new il_1.NamePointer(name);
            }
        }
    }
    _varsPointer(names) {
        let [pickName, pickProp] = names;
        let pick = this.bizEntity.pickColl[pickName];
        if (pick === undefined) {
            return;
        }
        const { pick: pickBase } = pick;
        if (pickBase !== undefined && pickBase.hasReturn(pickProp) === false) {
            return [undefined, `Pick '${pickName}' has no return '${pickProp}'`];
        }
        let bud = pickBase.getBud(pickProp);
        if (bud === undefined) {
            //bud = pickBase.getBud(pickProp);
            //return [undefined, `Pick '${pickName}' has no PROP '${pickProp}'`];
        }
        return [new il_1.DotVarPointer(bud), undefined];
    }
    _getBizFromEntityFromAlias(name) {
        switch (name) {
            default:
                return super._getBizFromEntityFromAlias(name);
            case 'pend':
                let { pend } = this.bizEntity;
                if (pend === undefined)
                    return;
                let fe = new il_1.BizFromEntity(undefined);
                fe.bizEntityArr = [pend];
                fe.bizPhraseType = BizPhraseType_1.BizPhraseType.pend;
                fe.bizEntityTable = il_1.EnumSysTable.pend;
                return fe;
        }
    }
    _getBizField(names) {
        return this.bizFieldSpace.getBizField(names);
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
exports.BizBinSpace = BizBinSpace;
class BizBinActSpace extends Biz_1.BizEntitySpace {
    constructor(outer, bizBin) {
        super(outer, bizBin);
        this.varNo = 1;
        this.bizFieldSpace = new il_1.BizBinActFieldSpace(this.bizEntity);
    }
    _varPointer(name, isField) {
        if (exports.binPreDefined.indexOf(name) >= 0) {
            return new il_1.NamePointer(name);
        }
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