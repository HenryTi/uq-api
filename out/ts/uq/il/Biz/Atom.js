"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizAtomState = exports.BizAtom = exports.BizSpec = void 0;
const parser_1 = require("../../parser");
const field_1 = require("../field");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizSpec extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'spec';
        this.keys = new Map();
    }
    parser(context) {
        return new parser_1.PBizSpec(this, context);
    }
    buildFields() {
        for (let [, value] of this.keys) {
            this.keyFields.push(this.buildField(value));
        }
        for (let [, value] of this.props) {
            this.propFields.push(this.buildField(value));
        }
    }
    buildSchema() {
        let ret = super.buildSchema();
        let keys = [];
        for (let [, value] of this.keys) {
            keys.push(value.buildSchema());
        }
        if (keys.length === 0)
            keys = undefined;
        let id = (0, field_1.idField)('id', 'big');
        let entitySchema = {
            name: this.name,
            type: "id",
            biz: "spec",
            private: false,
            sys: true,
            global: false,
            idType: 3,
            isMinute: false,
            keys: this.keyFields,
            fields: [
                id,
                ...this.keyFields,
                ...this.propFields
            ],
        };
        this.entitySchema = JSON.stringify(entitySchema);
        return Object.assign(ret, { keys });
    }
}
exports.BizSpec = BizSpec;
class BizAtom extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'atom';
    }
    // readonly states: Map<string, BizAtomState> = new Map();
    parser(context) {
        return new parser_1.PBizAtom(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        let base;
        if (this.base !== undefined) {
            base = this.base.name;
        }
        let spec;
        if (this.spec !== undefined) {
            spec = this.spec.name;
        }
        /*
        let states = [];
        for (let [, value] of this.states) {
            states.push(value.buildSchema());
        }
        if (states.length === 0) states = undefined;
        */
        let entitySchema = {
            name: this.name,
            type: "id",
            biz: "atom",
            private: false,
            sys: true,
            global: false,
            idType: 3,
            isMinute: false,
        };
        this.entitySchema = JSON.stringify(entitySchema);
        return Object.assign(ret, { base, spec, uom: this.uom });
    }
    get basePhrase() { return this.base === undefined ? '' : this.base.phrase; }
    getUom() {
        if (this.uom === true)
            return true;
        if (this.base === undefined)
            return;
        return this.base.getUom();
    }
    setUom() {
        if (this.uom === true)
            return true;
        if (this.base !== undefined) {
            this.uom = this.base.getUom();
        }
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        /*
        for (let [, value] of this.states) {
            value.buildPhrases(phrases, this.phrase)
        }
        */
    }
}
exports.BizAtom = BizAtom;
class BizAtomState extends Base_1.BizBase {
    constructor() {
        super(...arguments);
        this.type = 'atomstate';
    }
    parser(context) {
        return new parser_1.PBizAtomState(this, context);
    }
}
exports.BizAtomState = BizAtomState;
//# sourceMappingURL=Atom.js.map