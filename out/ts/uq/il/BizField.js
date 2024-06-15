"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinActFieldSpace = exports.FromInPendFieldSpace = exports.FromInQueryFieldSpace = exports.FromEntityFieldSpace = exports.BizFieldSpace = exports.BizFieldUser = exports.BizFieldVar = exports.BizFieldJsonProp = exports.BizFieldField = exports.BizFieldBinBud = exports.BizFieldBud = exports.BizField = void 0;
const builder_1 = require("../builder");
const BizPhraseType_1 = require("./Biz/BizPhraseType");
// in FROM statement, columns use BizField
// and in Where, BizField is used.
class BizField {
    constructor(space, tableAlias) {
        this.space = space;
        this.tableAlias = tableAlias;
    }
    getBud() {
        return undefined;
    }
    scanBinDiv() { }
}
exports.BizField = BizField;
class BizFieldBud extends BizField {
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
        let ret = this.createBBizFieldBud(dbContext);
        ret.noArrayAgg = this.space.bBudNoArrayAgg;
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
class BizFieldField extends BizField {
    constructor(space, tableAlias, name) {
        super(space, tableAlias);
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
class BizFieldUser extends BizField {
    buildSchema() {
        return `%user.${this.tableAlias}`;
    }
    db(dbContext) {
        return new builder_1.BBizFieldUser(dbContext, this);
    }
}
exports.BizFieldUser = BizFieldUser;
;
;
class BizFieldSpace {
    constructor() {
        this.nameBizFields = {};
        this.nameNameBizFields = {};
    }
    get bBudNoArrayAgg() { return; }
    getBizField(names) {
        let n0 = names[0];
        switch (names.length) {
            default:
                debugger;
                throw Error('error names');
            case 1: return this.bizFieldFromSolo(n0);
            case 2: return this.bizFieldFromDuo(n0, names[1]);
        }
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
        if (bud === undefined)
            debugger;
        return this.buildBizFieldFromBud(alias, bud);
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
                bud = this.bizBin.getSheetBud(n1);
                /*
                if (bud === undefined) {
                    debugger;
                    bud = this.bizBin.getSheetBud(n1);
                }
                */
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
}
exports.BizBinActFieldSpace = BizBinActFieldSpace;
//# sourceMappingURL=BizField.js.map