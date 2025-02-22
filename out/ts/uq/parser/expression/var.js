"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PVarOperand = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
class PVarOperand extends element_1.PElement {
    parse() {
        super.parse();
    }
    _parse() {
        // # column 中的value，是生成的，没有ts
        if (this.ts === undefined)
            return;
        switch (this.ts.token) {
            case tokens_1.Token.DOT:
                this.dotVar();
                break;
            case tokens_1.Token.XOR:
                this.ts.readToken();
                this.element.upField = this.ts.passVar();
                break;
        }
    }
    dotVar() {
        for (;;) {
            if (this.ts.token !== tokens_1.Token.DOT)
                break;
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.DOLLAR) {
                this.element._var.push('$');
                this.ts.readToken();
                return;
            }
            if (this.ts.token === tokens_1.Token.VAR) {
                this.element._var.push(this.ts.lowerVar);
                this.ts.readToken();
                return;
            }
            this.expect('变量');
        }
    }
    scan(space) {
        let { _var, dotFirst, upField } = this.element;
        let len = _var.length;
        if (dotFirst === true) {
            if (len !== 1) {
                this.log('标点符号dot之后必须而且只能跟字段名');
                return false;
            }
        }
        if (len > 2) {
            this.log('不能理解 ' + _var.join('.'));
            return false;
        }
        if (len === 0) {
            throw '变量解析错误!';
        }
        let ret = space.varsPointer(_var);
        let pointer;
        if (ret !== undefined) {
            pointer = ret[0];
            if (pointer === undefined) {
                let error = ret[1];
                if (error !== undefined) {
                    this.log(error);
                    return false;
                }
            }
        }
        if (pointer === undefined) {
            let var0 = _var[0];
            if (len === 1) {
                switch (var0) {
                    case '$user':
                        pointer = new il_1.UserPointer();
                        break;
                    case '$unit':
                        pointer = new il_1.UnitPointer();
                        break;
                    default:
                        if (upField !== undefined) {
                            return this.scanUpField(space, var0, upField);
                        }
                        if (dotFirst === undefined)
                            dotFirst = false;
                        pointer = space.varPointer(var0, dotFirst);
                        if (pointer === undefined) {
                            this.log('没有定义' + var0);
                            return false;
                        }
                        break;
                }
            }
            else {
                let var1 = _var[1];
                let enm = space.getEntity(var0);
                if (enm !== undefined) {
                    let val = enm.calcKeyValue(var1);
                    if (val !== undefined) {
                        this.element.enumValue = val;
                        return true;
                    }
                }
                let _const = space.getConst(var0);
                if (_const !== undefined) {
                    let v = _const.values[var1];
                    if (v === undefined) {
                        this.log(`Const ${_const.jName} 中没有定义 ${var1}`);
                        return false;
                    }
                    pointer = new il_1.ConstPointer(v);
                }
                /*
                #OPTIONS.Item 所以不需要了
                let options = space.uq.biz.bizEntities.get(var0) as BizOptions;
                if (options !== undefined) {
                    let optionsItem = options.items.find(v => v.name === var1);
                    this.element.options = options;
                    this.element.optionsItem = optionsItem;
                    if (optionsItem === undefined) {
                        this.log(`Options ${options.getJName()} 中没有定义 ${var1}`)
                        return false;
                    }
                    return true;
                }
                */
                let _obj = space.getBizFromEntityArrFromAlias(var0);
                if (_obj !== undefined) {
                    let { bizEntityArr } = _obj;
                    if (bizEntityArr.length > 0) {
                        let bud, fieldName;
                        for (let bizEntity of bizEntityArr) {
                            if (bizEntity.hasField(var1) === true) {
                                fieldName = var1;
                                break;
                            }
                            bud = bizEntity.getBud(var1);
                            if (bud !== undefined) {
                                break;
                            }
                        }
                        if (bud !== undefined) {
                            pointer = new il_1.BizEntityBudPointer(_obj, bud);
                        }
                        else if (fieldName !== undefined) {
                            pointer = fieldName === 'id' ? new il_1.BizEntityFieldIdPointer(_obj) :
                                new il_1.BizEntityFieldPointer(_obj, fieldName);
                        }
                        else {
                            this.log(`Biz entity ${bizEntityArr.map(v => v.jName).join(',')} has not ${var1}`);
                            return false;
                        }
                    }
                    else if (var1 === 'id') {
                        pointer = new il_1.BizEntityFieldIdPointer(_obj);
                    }
                    else {
                        this.log(`unknown ${var0}.${var1}`);
                        return false;
                    }
                }
                else {
                    // t.a 那么t一定是from的table，不可能是entity
                    let table = space.getTableByAlias(var0);
                    if (table === undefined) {
                        let t = space.getTableByAlias(var0);
                        this.log(`没有定义Pick、表、Const、Enum、Options '${var0}'`);
                        return false;
                    }
                    pointer = table.fieldPointer(var1);
                    if (pointer === undefined) {
                        this.log('表' + var0 + '中没有字段' + var1);
                        return false;
                    }
                }
            }
        }
        this.element.pointer = pointer;
        space.groupType = pointer.groupType;
        return true;
    }
    scanUpField(space, v0, upField) {
        let _obj = space.getBizFromEntityArrFromAlias(v0);
        if (_obj === undefined) {
            this.log(`${v0} undefined`);
            return false;
        }
        let { bizEntityArr } = _obj;
        let bizEntity = bizEntityArr[0];
        if (bizEntity === undefined) {
            this.log(`${v0} undefined`);
            return false;
        }
        let pointer;
        switch (bizEntity.bizPhraseType) {
            default: return false;
            case BizPhraseType_1.BizPhraseType.fork:
                {
                    const { ownFields } = il_1.BizAtom;
                    if (ownFields.findIndex(v => upField) < 0) {
                        this.log(`FORK ^ [${ownFields.join(',')}]`);
                        return false;
                    }
                    pointer = new il_1.BizEntityForkUpPointer(_obj, upField);
                }
                break;
            case BizPhraseType_1.BizPhraseType.bin:
                {
                    const { ownFields } = il_1.BizSheet;
                    if (ownFields.findIndex(v => upField) < 0) {
                        this.log(`BIN ^ [${ownFields.join(',')}]`);
                        return false;
                    }
                    pointer = new il_1.BizEntityBinUpPointer(_obj, upField);
                }
                break;
        }
        this.element.pointer = pointer;
        space.groupType = pointer.groupType;
        return true;
    }
}
exports.PVarOperand = PVarOperand;
//# sourceMappingURL=var.js.map