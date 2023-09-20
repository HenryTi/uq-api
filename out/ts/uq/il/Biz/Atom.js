"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizPick = exports.BizAtomIDAny = exports.BizAtomBud = exports.BizAtomSpec = exports.BizAtomIDWithBase = exports.BizAtom = exports.BizAtomID = void 0;
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
    db(dbContext) {
        return new builder_1.BBizAtom(dbContext, this);
    }
}
exports.BizAtom = BizAtom;
class BizAtomIDWithBase extends BizAtomID {
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            base: this.base.name,
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
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            keys: (_a = this.keys) === null || _a === void 0 ? void 0 : _a.map(v => v.buildSchema(res)),
        });
    }
}
exports.BizAtomSpec = BizAtomSpec;
class BizAtomBud extends BizAtomIDWithBase {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.bud;
    }
    parser(context) {
        return new parser_1.PBizAtomBud(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            join: this.join.name,
        });
    }
}
exports.BizAtomBud = BizAtomBud;
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
class BizPick extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.pick;
        this.atoms = [];
        this.joins = [];
    }
    parser(context) {
        return new parser_1.PBizPick(this, context);
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            atoms: this.atoms.map(v => v.name),
            uom: this.uom,
            spec: (_a = this.spec) === null || _a === void 0 ? void 0 : _a.name,
            joins: this.joins.map(v => v.name),
        });
    }
}
exports.BizPick = BizPick;
//# sourceMappingURL=Atom.js.map