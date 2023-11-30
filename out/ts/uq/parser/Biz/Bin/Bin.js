"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBinActStatements = exports.PBizBinAct = exports.detailPreDefined = exports.PBizBin = void 0;
const il_1 = require("../../../il");
const statement_1 = require("../../statement");
const tokens_1 = require("../../tokens");
const Base_1 = require("../Base");
const Biz_1 = require("../Biz");
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
            input: this.parseInput,
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
        let bizBud = this.parseBud(budName, ui, 'dec');
        if (this.ts.prevToken !== tokens_1.Token.RBRACE) {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
        return bizBud;
    }
    scan0(space) {
        let ok = true;
        const { pickArr, act } = this.element;
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
        const { pickArr, i, x, value: budValue, amount: budAmount, price: budPrice } = this.element;
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
            /*
            if (value !== undefined) {
                const { exp } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(binSpace) === false) {
                        ok = false;
                    }
                }
            }
            */
        };
        scanBudValue(budValue);
        scanBudValue(budAmount);
        scanBudValue(budPrice);
        if (super.scan(binSpace) === false)
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
/*
export class PPickInput extends PElement<PickInput> {
    protected _parse(): void {
        for (; ;) {
            if (this.ts.token === Token.RBRACE) {
                this.ts.readToken();
                break;
            }
        }
    }
}
*/
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
        if (this.bizEntity.props.has(name) === true) {
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
            const { pick: pickBase } = pick;
            if (pickBase !== undefined && pickBase.hasReturn(pickProp) === false) {
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
class BizBinActSpace extends BizBinSpace {
    _varPointer(name, isField) {
        if (exports.detailPreDefined.indexOf(name) >= 0) {
            return new il_1.VarPointer();
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
        let actSpace = new BizBinActSpace(space, this.element.bizBin);
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