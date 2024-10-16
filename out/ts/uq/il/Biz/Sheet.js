"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSheet = exports.EnumDetailOperate = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
var EnumDetailOperate;
(function (EnumDetailOperate) {
    EnumDetailOperate[EnumDetailOperate["default"] = 0] = "default";
    EnumDetailOperate[EnumDetailOperate["pend"] = 1] = "pend";
    EnumDetailOperate[EnumDetailOperate["direct"] = 2] = "direct";
    EnumDetailOperate[EnumDetailOperate["scan"] = 3] = "scan";
})(EnumDetailOperate || (exports.EnumDetailOperate = EnumDetailOperate = {}));
class BizSheet extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.fields = ['id', 'no'];
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.sheet;
        this.outs = {};
        this.details = [];
    }
    parser(context) {
        return new parser_1.PBizSheet(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        if (this.main === undefined)
            debugger;
        let search;
        if (this.bizSearch !== undefined) {
            search = {};
            for (let { entity, buds } of this.bizSearch.params) {
                const { id } = entity;
                for (let bud of buds) {
                    if (bud === undefined)
                        debugger;
                    search[id] = bud.id;
                }
            }
        }
        ret = Object.assign(Object.assign({}, ret), { io: this.io, main: this.main.id, details: this.details.map(v => {
                const { bin, caption, operate } = v;
                return {
                    bin: bin.id,
                    caption, // 此处暂时不做res翻译
                    operate,
                };
            }), search });
        return ret;
    }
    db(dbContext) {
        return new builder_1.BBizSheet(dbContext, this);
    }
    checkUserProp(prop) {
    }
}
exports.BizSheet = BizSheet;
//# sourceMappingURL=Sheet.js.map