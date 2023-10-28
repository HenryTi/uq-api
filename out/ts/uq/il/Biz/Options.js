"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizOptions = exports.OptionsItem = exports.OptionsItemValueType = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
var OptionsItemValueType;
(function (OptionsItemValueType) {
    OptionsItemValueType[OptionsItemValueType["none"] = 0] = "none";
    OptionsItemValueType[OptionsItemValueType["int"] = 1] = "int";
    OptionsItemValueType[OptionsItemValueType["dec"] = 2] = "dec";
    OptionsItemValueType[OptionsItemValueType["str"] = 3] = "str";
})(OptionsItemValueType || (exports.OptionsItemValueType = OptionsItemValueType = {}));
class OptionsItem extends Bud_1.BizBudValue {
    get optionsItemType() { return this._itemType; }
    parser(context) {
        debugger;
        return;
    }
    get dataType() {
        return;
    }
    get canIndex() {
        return false;
    }
}
exports.OptionsItem = OptionsItem;
class BizOptions extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.options;
        this.fields = [];
        this.items = [];
    }
    parser(context) {
        return new parser_1.PBizOptions(this, context);
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        for (const item of this.items) {
            const { name, caption } = item;
            phrases.push([`${this.phrase}`, caption, this.basePhrase, this.typeNum]);
        }
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        let items = [];
        for (let item of this.items) {
            const { id, name, caption, phrase, itemValue: value, optionsItemType } = item;
            items.push({
                id, name, caption, value, phrase, optionsItemType
            });
        }
        Object.assign(ret, { items });
        return ret;
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        for (let item of this.items)
            callback(item);
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud !== undefined)
            return bud;
        for (let item of this.items) {
            if (item.name === name)
                return item;
        }
        return;
    }
}
exports.BizOptions = BizOptions;
//# sourceMappingURL=Options.js.map