"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizAtomIDAny = exports.BizAtomSpec = exports.BizAtomIDWithBase = exports.BizAtom = exports.BizAtomID = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizAtomID extends Entity_1.BizEntity {
    get basePhrase() { return this.extends === undefined ? '' : this.extends.phrase; }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(ret, { extends: (_a = this.extends) === null || _a === void 0 ? void 0 : _a.name });
    }
}
exports.BizAtomID = BizAtomID;
class BizAtom extends BizAtomID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.atom;
    }
    parser(context) {
        return new parser_1.PBizAtom(this, context);
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            uuid: this.uuid,
            uom: this.uom,
            ex: (_a = this.ex) === null || _a === void 0 ? void 0 : _a.buildSchema(res),
        });
    }
}
exports.BizAtom = BizAtom;
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
        this.bizPhraseType = Base_1.BizPhraseType.spec;
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
    /*
    getAllBuds(): IBud[] {
        let buds = super.getAllBuds();
        for (let key of this.keys) buds.push(key.toIBud());
        return buds;
    }
    */
    db(dbContext) {
        return new builder_1.BBizSpec(dbContext, this);
    }
}
exports.BizAtomSpec = BizAtomSpec;
class BizAtomIDAny extends BizAtomID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.any;
        this.name = '*';
    }
    parser(context) { return undefined; }
}
BizAtomIDAny.current = new BizAtomIDAny(undefined);
exports.BizAtomIDAny = BizAtomIDAny;
//# sourceMappingURL=Atom.js.map