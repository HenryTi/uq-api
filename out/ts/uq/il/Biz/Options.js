"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizOptions = exports.OptionsItemValueType = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
var OptionsItemValueType;
(function (OptionsItemValueType) {
    OptionsItemValueType[OptionsItemValueType["none"] = 0] = "none";
    OptionsItemValueType[OptionsItemValueType["int"] = 1] = "int";
    OptionsItemValueType[OptionsItemValueType["dec"] = 2] = "dec";
    OptionsItemValueType[OptionsItemValueType["str"] = 3] = "str";
})(OptionsItemValueType = exports.OptionsItemValueType || (exports.OptionsItemValueType = {}));
class BizOptions extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'options';
        this.items = [];
    }
    parser(context) {
        return new parser_1.PBizOptions(this, context);
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        for (const item of this.items) {
            const { name, caption } = item;
            phrases.push([`${this.basePhrase}`, caption, this.basePhrase, this.typeNum]);
        }
    }
    buildSchema() {
        let ret = super.buildSchema();
        let items = [];
        for (let item of this.items) {
            items.push(item);
        }
        Object.assign(ret, { items });
        return ret;
    }
    getAllBuds() {
        const buds = [];
        const typeNum = Base_1.BizPhraseType['optionsitem'];
        for (let item of this.items) {
            const { name, caption, value, type } = item;
            buds.push({
                phrase: `${this.name}.${name}`,
                caption,
                memo: undefined,
                dataTypeNum: undefined,
                objName: undefined,
                typeNum: String(typeNum),
                optionsItemType: type,
                value,
            });
        }
        ;
        return buds;
    }
}
exports.BizOptions = BizOptions;
//# sourceMappingURL=Options.js.map