"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizAtomIDAny = exports.BizAtomSpec = exports.BizAtomIDWithBase = exports.BizDuo = exports.BizAtom = exports.BizAtomID = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizAtomID extends Entity_1.BizEntity {
    get basePhrase() { return this.extends === undefined ? '' : this.extends.phrase; }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(ret, { extends: (_a = this.extends) === null || _a === void 0 ? void 0 : _a.id });
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
}
exports.BizAtomID = BizAtomID;
class BizAtom extends BizAtomID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.atom;
        this.fields = ['id', 'no', 'ex'];
    }
    parser(context) {
        return new parser_1.PBizAtom(this, context);
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            uuid: this.uuid,
            // uom: this.uom,
            ex: (_a = this.ex) === null || _a === void 0 ? void 0 : _a.buildSchema(res),
        });
    }
}
exports.BizAtom = BizAtom;
// 分子：atom 原子的合成
class BizDuo extends BizAtomID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.duo;
        this.i = {};
        this.x = {};
        this.fields = ['id', 'i', 'x'];
    }
    parser(context) {
        return new parser_1.PBizDuo(this, context);
    }
}
exports.BizDuo = BizDuo;
class BizAtomIDWithBase extends BizAtomID {
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            base: this.base.name,
            ix: this.isIxBase,
        });
    }
}
exports.BizAtomIDWithBase = BizAtomIDWithBase;
class BizAtomSpec extends BizAtomIDWithBase {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.spec;
        this.fields = ['id'];
        this.keys = [];
    }
    parser(context) {
        return new parser_1.PBizAtomSpec(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        let keys = this.keys.map(v => {
            return v.buildSchema(res);
        });
        return Object.assign(ret, {
            keys,
        });
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
        return new builder_1.BBizSpec(dbContext, this);
    }
}
exports.BizAtomSpec = BizAtomSpec;
class BizAtomIDAny extends BizAtomID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.any;
        this.fields = ['id'];
        this.name = '*';
    }
    parser(context) { return undefined; }
}
exports.BizAtomIDAny = BizAtomIDAny;
BizAtomIDAny.current = new BizAtomIDAny(undefined);
//# sourceMappingURL=Atom.js.map