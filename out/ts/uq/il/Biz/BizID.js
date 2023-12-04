"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizIDAny = exports.BizSpec = exports.BizIDWithBase = exports.BizDuo = exports.BizAtom = exports.BizIDExtendable = exports.BizID = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
// 任何可以独立存在，可被引用ID
// 扩展和继承：有两个方式，一个是typescript里面的extends，一个是spec的base
// 按照这个原则，BizBin应该也是BizID。当前不处理。以后可以处理
// BizBin是一次操作行为记录，跟普通的BizID区别明显。作为ID仅用于引用。
class BizID extends Entity_1.BizEntity {
}
exports.BizID = BizID;
class BizIDExtendable extends BizID {
    get extendsPhrase() { return this.extends === undefined ? '' : this.extends.phrase; }
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
exports.BizIDExtendable = BizIDExtendable;
class BizAtom extends BizIDExtendable {
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
// duo: 二重奏
class BizDuo extends BizID {
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
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.i = this.ixFieldSchema(this.i);
        ret.x = this.ixFieldSchema(this.x);
        return ret;
    }
}
exports.BizDuo = BizDuo;
class BizIDWithBase extends BizIDExtendable {
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            base: this.base.name,
            ix: this.isIxBase,
        });
    }
}
exports.BizIDWithBase = BizIDWithBase;
class BizSpec extends BizIDWithBase {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.spec;
        this.fields = ['id'];
        this.keys = [];
    }
    parser(context) {
        return new parser_1.PBizSpec(this, context);
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
exports.BizSpec = BizSpec;
class BizIDAny extends BizID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.any;
        this.fields = ['id'];
        this.name = '*';
    }
    parser(context) { return undefined; }
}
exports.BizIDAny = BizIDAny;
BizIDAny.current = new BizIDAny(undefined);
//# sourceMappingURL=BizID.js.map