"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinActFieldSpace = exports.FromInPendFieldSpace = exports.FromInQueryFieldSpace = exports.FromEntityFieldSpace = exports.BizFieldSpace = exports.BizFieldOptionsItem = exports.BizFieldUser = exports.BizFieldVar = exports.BizFieldJsonProp = exports.BizFieldField = exports.BizFieldPendSheet = exports.BizFieldPendBin = exports.BizFieldBinBinBudSelect = exports.BizFieldPendBinBudSelect = exports.BizFieldPendBudSelect = exports.BizFieldBinBudSelect = exports.BizFieldBinBud = exports.BizFieldBud = exports.BizFieldTableAlias = exports.BizForkBaseField = exports.BizBinVar = exports.BizField = void 0;
const builder_1 = require("../builder");
const BizPhraseType_1 = require("./Biz/BizPhraseType");
// in FROM statement, columns use BizField
// and in Where, BizField is used.
class BizField {
    constructor(space) {
        this.space = space;
    }
    getBud() {
        return undefined;
    }
    scanBinDiv() { }
}
exports.BizField = BizField;
class BizBinVar extends BizField {
    db(dbContext) { return new builder_1.BBizBinVar(dbContext, this); }
    buildSchema() { return; }
    get tableAlias() { return undefined; }
}
exports.BizBinVar = BizBinVar;
class BizForkBaseField extends BizField {
    db(dbContext) { return new builder_1.BBizForkBaseField(dbContext, this); }
    buildSchema() { return; }
    get tableAlias() { return undefined; }
}
exports.BizForkBaseField = BizForkBaseField;
class BizFieldTableAlias extends BizField {
    constructor(space, tableAlias) {
        super(space);
        this.tableAlias = tableAlias;
    }
}
exports.BizFieldTableAlias = BizFieldTableAlias;
class BizFieldBud extends BizFieldTableAlias {
    constructor(space, tableAlias, bud) {
        super(space, tableAlias);
        if (bud === undefined)
            debugger;
        this.bud = bud;
    }
    getBud() {
        return this.bud;
    }
    db(dbContext) {
        var _a;
        let ret = this.createBBizFieldBud(dbContext);
        ret.noArrayAgg = (_a = this.space) === null || _a === void 0 ? void 0 : _a.bBudNoArrayAgg;
        return ret;
    }
    buildSchema() { var _a; return [(_a = this.bud.entity) === null || _a === void 0 ? void 0 : _a.id, this.bud.id]; }
    createBBizFieldBud(dbContext) {
        return new builder_1.BBizFieldBud(dbContext, this);
    }
    scanBinDiv() {
        if (this.bud === undefined)
            return;
        const { entity } = this.bud;
        const { bizPhraseType } = entity;
        if (bizPhraseType === BizPhraseType_1.BizPhraseType.bin) {
            let entityBin = entity;
            this.div = entityBin.getDivFromBud(this.bud);
            if (this.div === undefined)
                debugger;
        }
    }
}
exports.BizFieldBud = BizFieldBud;
class BizFieldBinBud extends BizFieldBud {
    createBBizFieldBud(dbContext) {
        return new builder_1.BBizFieldBinBud(dbContext, this);
    }
}
exports.BizFieldBinBud = BizFieldBinBud;
class BizFieldBinBudSelect extends BizField {
    constructor() {
        super(...arguments);
        this.tableAlias = undefined;
    }
    buildSchema() {
        throw new Error("Method not implemented.");
    }
}
exports.BizFieldBinBudSelect = BizFieldBinBudSelect;
class BizFieldPendBudSelect extends BizFieldBinBudSelect {
    constructor(space, pend, bud) {
        super(space);
        this.pend = pend;
        this.bud = bud;
    }
    db(dbContext) {
        return new builder_1.BBizFieldPendBudSelect(dbContext, this);
    }
}
exports.BizFieldPendBudSelect = BizFieldPendBudSelect;
class BizFieldPendBinBudSelect extends BizFieldBinBudSelect {
    constructor(space, pend, bud, budArr) {
        super(space);
        this.pend = pend;
        this.bud = bud;
        this.budArr = budArr;
    }
    db(dbContext) {
        return new builder_1.BBizFieldPendBinBudSelect(dbContext, this);
    }
}
exports.BizFieldPendBinBudSelect = BizFieldPendBinBudSelect;
class BizFieldBinBinBudSelect extends BizFieldBinBudSelect {
    constructor(space, bizBin, bud, budArr) {
        super(space);
        this.bizBin = bizBin;
        this.bud = bud;
        this.budArr = budArr;
    }
    db(dbContext) {
        return new builder_1.BBizFieldBinBinBudSelect(dbContext, this);
    }
}
exports.BizFieldBinBinBudSelect = BizFieldBinBinBudSelect;
// %pend.bin
class BizFieldPendBin extends BizField {
    buildSchema() {
        throw new Error("Method not implemented.");
    }
    db(dbContext) {
        return new builder_1.BBizFieldPendBin(dbContext, this);
    }
}
exports.BizFieldPendBin = BizFieldPendBin;
// %pend.sheet
class BizFieldPendSheet extends BizField {
    buildSchema() {
        throw new Error("Method not implemented.");
    }
    db(dbContext) {
        return new builder_1.BBizFieldPendSheet(dbContext, this);
    }
}
exports.BizFieldPendSheet = BizFieldPendSheet;
class BizFieldField extends BizField {
    constructor(space, tableAlias, name) {
        super(space);
        this.tableAlias = tableAlias;
        this.name = name;
    }
    db(dbContext) {
        return new builder_1.BBizFieldField(dbContext, this);
    }
    buildSchema() { return []; }
}
exports.BizFieldField = BizFieldField;
class BizFieldJsonProp extends BizFieldBud {
    db(dbContext) {
        return new builder_1.BBizFieldJsonProp(dbContext, this);
    }
}
exports.BizFieldJsonProp = BizFieldJsonProp;
class BizFieldVar extends BizFieldField {
    db(dbContext) {
        return new builder_1.BBizFieldBinVar(dbContext, this);
    }
}
exports.BizFieldVar = BizFieldVar;
class BizFieldUser extends BizFieldTableAlias {
    buildSchema() {
        return `%user.${this.tableAlias}`;
    }
    db(dbContext) {
        return new builder_1.BBizFieldUser(dbContext, this);
    }
}
exports.BizFieldUser = BizFieldUser;
class BizFieldOptionsItem extends BizField {
    constructor(options, optionsItem) {
        super(undefined);
        this.options = options;
        this.optionsItem = optionsItem;
    }
    db(dbContext) {
        return new builder_1.BBizFieldOptionsItem(dbContext, this);
    }
    buildSchema() {
        return `%${this.options.name}.${this.optionsItem.name}`;
    }
    get tableAlias() {
        return;
    }
}
exports.BizFieldOptionsItem = BizFieldOptionsItem;
;
;
class BizFieldSpace {
    constructor() {
        this.nameBizFields = {};
        this.nameNameBizFields = {};
    }
    get bBudNoArrayAgg() { return; }
    getBizField(names) {
        let ret;
        let n0 = names[0];
        switch (names.length) {
            case 1:
                ret = this.bizFieldFromSolo(n0);
                break;
            case 2:
                ret = this.bizFieldFromDuo(n0, names[1]);
                break;
        }
        if (ret === undefined) {
            ret = this.bizFieldFromMulti(names);
        }
        return ret;
    }
    bizFieldFromSolo(name) {
        let bizField = this.nameBizFields[name];
        if (bizField !== undefined)
            return bizField;
        bizField = this.buildBizFieldFromSolo(name);
        if (bizField === null)
            return null;
        if (bizField !== undefined) {
            this.nameBizFields[name] = bizField;
        }
        return bizField;
    }
    buildBizFieldFromSolo(name) {
        if (name === 'bin') {
            return new BizBinVar(this);
        }
        return this.buildBizFieldFromDuo('$t1', name);
    }
    bizFieldFromDuo(n0, n1) {
        let bizField;
        let nameBizFields = this.nameNameBizFields[n0];
        if (nameBizFields === undefined) {
            nameBizFields = {};
            this.nameNameBizFields[n0] = nameBizFields;
        }
        else {
            bizField = nameBizFields[n1];
        }
        if (bizField !== undefined)
            return bizField;
        bizField = this.buildBizFieldFromDuo(n0, n1);
        if (bizField !== undefined) {
            nameBizFields[n1] = bizField;
            return bizField;
        }
    }
    bizFieldFromMulti(names) {
        return; // null;
    }
}
exports.BizFieldSpace = BizFieldSpace;
class FromEntityFieldSpace extends BizFieldSpace {
    constructor(from) {
        super();
        this.from = from;
    }
    buildBizFieldFromDuo(n0, n1) {
        let bizEntityFrom = this.from.getBizFromEntityFromAlias(n0);
        if (bizEntityFrom === undefined)
            return undefined;
        const { alias, bizEntityArr } = bizEntityFrom;
        for (let bizEntity of bizEntityArr) {
            if (bizEntity.hasField(n1) === true) {
                return new BizFieldField(this, alias, n1);
            }
            let bud = bizEntity.props.get(n1);
            if (bud !== undefined) {
                return this.buildBizFieldFromBud(alias, bud);
            }
        }
        return new BizFieldVar(this, alias, n1);
    }
    buildBizFieldFromBud(alias, bud) {
        return new BizFieldBud(this, alias, bud);
    }
}
exports.FromEntityFieldSpace = FromEntityFieldSpace;
class FromInQueryFieldSpace extends FromEntityFieldSpace {
}
exports.FromInQueryFieldSpace = FromInQueryFieldSpace;
class FromInPendFieldSpace extends FromEntityFieldSpace {
    get bBudNoArrayAgg() { return true; }
    buildBizFieldFromDuo(n0, n1) {
        const { bizPend } = this.from.pendQuery;
        let alias, bud;
        switch (n0) {
            default: return undefined;
            case '$t1':
            case '$':
                bud = bizPend.getBud(n1);
                if (bud === undefined) {
                    return null;
                }
                alias = 'a';
                return new BizFieldJsonProp(this, alias, bud);
            case 'bin':
                bud = bizPend.getBinBud(n1);
                alias = 'b';
                break;
            case 'sheet':
                bud = bizPend.getSheetBud(n1);
                alias = 'c';
                break;
        }
        // if (bud === undefined) debugger;
        if (bud === undefined) {
            return null;
        }
        return this.buildBizFieldFromBud(alias, bud);
    }
    bizFieldFromMulti(names) {
        return null;
    }
}
exports.FromInPendFieldSpace = FromInPendFieldSpace;
class BizBinActFieldSpace extends BizFieldSpace {
    constructor(bizBin) {
        super();
        this.bizBin = bizBin;
    }
    get bBudNoArrayAgg() { return true; }
    buildBizFieldFromDuo(n0, n1) {
        let alias, bud;
        switch (n0) {
            default: return undefined;
            case '$t1':
            case '$':
                bud = this.bizBin.getBud(n1);
                alias = 'bin';
                break;
            case 'bin':
                bud = this.bizBin.getBud(n1);
                alias = 'b';
                break;
            case 'sheet':
                bud = this.bizBin.getSheetMainBud(n1);
                alias = 'sheet';
                break;
        }
        if (bud === undefined)
            return null;
        return this.buildBizFieldFromBud(alias, bud);
    }
    buildBizFieldFromBud(alias, bud) {
        return new BizFieldBinBud(this, alias, bud);
    }
    bizFieldFromMulti(names) {
        var _a, _b;
        let p = 0;
        let n0 = names[p++];
        const { length } = names;
        if (length < 2)
            return null;
        let bizBin;
        const { pend } = this.bizBin;
        let bud;
        switch (n0) {
            case 'pend':
                if (this.bizBin.pend === undefined)
                    return undefined;
                let n1 = names[p++];
                if (p === length) {
                    switch (n1) {
                        default:
                            let bud = pend.getBud(n1);
                            if (bud === undefined)
                                return;
                            return new BizFieldPendBudSelect(this, pend, bud);
                        case 'bin':
                            return new BizFieldPendBin(this);
                        case 'sheet':
                            return new BizFieldPendSheet(this);
                    }
                }
                else {
                    switch (n1) {
                        default:
                            bud = pend.getBud(n1);
                            if (bud === undefined)
                                return;
                            if (bud.dataType !== BizPhraseType_1.BudDataType.bin)
                                return undefined;
                            bizBin = bud.bin;
                            break;
                        case 'bin':
                            bizBin = pend.bizBins[0];
                            break;
                        case 'sheet':
                            bizBin = (_b = (_a = pend.bizBins[0]) === null || _a === void 0 ? void 0 : _a.sheetArr[0]) === null || _b === void 0 ? void 0 : _b.main;
                            break;
                    }
                    let budArr = this.buildBizFieldFromBin(bizBin, names, p);
                    if (budArr === undefined) {
                        return null;
                    }
                    return new BizFieldPendBinBudSelect(this, pend, bud, budArr);
                }
            default:
                bud = this.bizBin.getBud(n0);
                if (bud === undefined)
                    return undefined;
                if (bud.dataType !== BizPhraseType_1.BudDataType.bin)
                    return undefined;
                bizBin = bud.bin;
                let budArr = this.buildBizFieldFromBin(bizBin, names, p);
                if (budArr === undefined) {
                    return null;
                }
                return new BizFieldBinBinBudSelect(this, this.bizBin, bud, budArr);
        }
    }
    buildBizFieldFromBin(bizBin, names, pName) {
        if (bizBin === undefined)
            return;
        const { length } = names;
        let budArr = [];
        for (let i = pName; i < length; i++) {
            let name = names[i];
            let bud = bizBin.getBud(name);
            if (bud === undefined)
                break;
            budArr.push(bud);
            if (bud.dataType !== BizPhraseType_1.BudDataType.bin) {
                if (i < length - 1)
                    return null;
                break;
            }
            bizBin = bud.bin;
        }
        return budArr;
    }
}
exports.BizBinActFieldSpace = BizBinActFieldSpace;
//# sourceMappingURL=BizField.js.map