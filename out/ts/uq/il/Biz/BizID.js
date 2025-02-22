"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizIDAny = exports.BizCombo = exports.BizFork = exports.BizIDWithBase = exports.BizAtom = exports.IDUnique = exports.BizIDExtendable = exports.BizIDWithShowBuds = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
// 任何可以独立存在，可被引用ID
// 扩展和继承：有两个方式，一个是typescript里面的extends，一个是spec的base
// 按照这个原则，BizBin应该也是BizID。当前不处理。以后可以处理
// BizBin是一次操作行为记录，跟普通的BizID区别明显。作为ID仅用于引用。
class BizIDWithShowBuds extends Entity_1.BizID {
    buildSchema(res) {
        let ret = super.buildSchema(res);
        if (this.titleBuds !== undefined) {
            ret[':&'] = this.titleBuds.map(v => v.id);
        }
        if (this.primeBuds !== undefined) {
            ret[':'] = this.primeBuds.map(v => v.id);
        }
        return ret;
    }
    getTitlePrimeBuds() {
        let ret = [];
        let { titleBuds, primeBuds } = this;
        if (titleBuds !== undefined)
            ret.push(...titleBuds);
        if (primeBuds !== undefined)
            ret.push(...primeBuds);
        return ret;
    }
}
exports.BizIDWithShowBuds = BizIDWithShowBuds;
class BizIDExtendable extends BizIDWithShowBuds {
    constructor() {
        super(...arguments);
        this.main = undefined;
    }
    get extendsPhrase() { return this.extends === undefined ? '' : this.extends.phrase; }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
    }
    buildSchema(res) {
        var _a, _b;
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            extends: (_a = this.extends) === null || _a === void 0 ? void 0 : _a.id,
            uniques: (_b = this.uniques) === null || _b === void 0 ? void 0 : _b.map(v => v.name),
        });
    }
    getBud(name) {
        let ret = super.getBud(name);
        if (ret !== undefined)
            return ret;
        for (let p = this.extends; p !== undefined; p = p.extends) {
            ret = p.getBud(name);
            if (ret !== undefined)
                return ret;
        }
    }
    getUnique(name) {
        var _a, _b;
        let u = (_a = this.uniques) === null || _a === void 0 ? void 0 : _a.find(v => v.name === name);
        if (u !== undefined)
            return u;
        return (_b = this.extends) === null || _b === void 0 ? void 0 : _b.getUnique(name);
    }
    getUniques() {
        var _a;
        let us = [...((_a = this.uniques) !== null && _a !== void 0 ? _a : [])];
        if (this.extends === undefined)
            return us;
        us.push(...this.extends.getUniques());
        return us;
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        if (this.uniques !== undefined) {
            for (let unique of this.uniques) {
                callback(unique);
            }
        }
    }
    getTitlePrimeBuds() {
        let ret = [];
        for (let p = this; p !== undefined; p = p.extends) {
            let { titleBuds, primeBuds } = p;
            if (titleBuds !== undefined)
                ret.push(...titleBuds);
            if (primeBuds !== undefined)
                ret.push(...primeBuds);
        }
        return ret;
    }
    decendants(set) {
        super.decendants(set);
        if (this.extendeds !== undefined) {
            for (let e of this.extendeds)
                e.decendants(set);
        }
    }
}
exports.BizIDExtendable = BizIDExtendable;
class IDUnique extends Bud_1.BizBud {
    constructor(bizAtom, name, ui) {
        super(bizAtom, name, ui);
        this.dataType = BizPhraseType_1.BudDataType.unique;
        this.bizAtom = bizAtom;
    }
    clone(entity, name, ui) {
        return new IDUnique(this.bizAtom, name, ui);
    }
    parser(context) {
        return new parser_1.PIDUnique(this, context);
    }
}
exports.IDUnique = IDUnique;
class BizAtom extends BizIDExtendable {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.atom;
        this.fields = BizAtom.ownFields;
    }
    parser(context) {
        return new parser_1.PBizAtom(this, context);
    }
    db(dbContext) {
        return new builder_1.BBizAtom(dbContext, this);
    }
}
exports.BizAtom = BizAtom;
BizAtom.ownFields = ['id', 'no', 'ex'];
class BizIDWithBase extends BizIDExtendable {
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            base: this.base.id,
            preset: this.preset,
        });
    }
}
exports.BizIDWithBase = BizIDWithBase;
class BizFork extends BizIDWithBase {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.fork;
        this.fields = ['id'];
        this.keys = [];
    }
    parser(context) {
        return new parser_1.PBizFork(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        let keys = this.keys.map(v => {
            return v.buildSchema(res);
        });
        ret.keys = keys;
        return ret;
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        for (let key of this.keys) {
            key.buildPhrases(phrases, phrase);
        }
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        for (let key of this.keys)
            callback(key);
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud !== undefined)
            return bud;
        for (let kBud of this.keys) {
            if (kBud.name === name)
                return kBud;
        }
        return this.base.getBud(name);
    }
    db(dbContext) {
        return new builder_1.BBizFork(dbContext, this);
    }
}
exports.BizFork = BizFork;
class BizCombo extends BizIDWithShowBuds {
    constructor() {
        super(...arguments);
        this.fields = ['id'];
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.combo;
        this.keys = [];
        this.indexes = [];
        this.main = undefined;
    }
    parser(context) {
        return new parser_1.PBizCombo(this, context);
    }
    db(dbContext) {
        return new builder_1.BBizCombo(dbContext, this);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        let keys = this.keys.map(v => {
            return v.buildSchema(res);
        });
        ret.keys = keys;
        return ret;
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        for (let key of this.keys) {
            key.buildPhrases(phrases, phrase);
        }
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        for (let key of this.keys)
            callback(key);
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud !== undefined)
            return bud;
        for (let kBud of this.keys) {
            if (kBud.name === name)
                return kBud;
        }
        return;
    }
}
exports.BizCombo = BizCombo;
class BizIDAny extends BizIDWithShowBuds {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.any;
        this.fields = ['id'];
        this.main = undefined;
        this.name = '*';
    }
    parser(context) { return undefined; }
}
exports.BizIDAny = BizIDAny;
BizIDAny.current = new BizIDAny(undefined);
//# sourceMappingURL=BizID.js.map