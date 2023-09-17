"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizAtomState = exports.BizAtom = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizAtom extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'atom';
        this.keys = [];
    }
    parser(context) {
        return new parser_1.PBizAtom(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        let _extends;
        if (this.extends !== undefined) {
            _extends = this.extends.name;
        }
        let spec;
        if (this.spec !== undefined) {
            spec = this.spec.name;
        }
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
        return Object.assign(ret, { extends: _extends, spec, uom: this.uom });
    }
    get basePhrase() { return this.extends === undefined ? '' : this.extends.phrase; }
    getUom() {
        if (this.uom === true)
            return true;
        if (this.extends === undefined)
            return;
        return this.extends.getUom();
    }
    setUom() {
        if (this.uom === true)
            return true;
        if (this.extends !== undefined) {
            this.uom = this.extends.getUom();
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
    db(dbContext) {
        return new builder_1.BBizAtom(dbContext, this);
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