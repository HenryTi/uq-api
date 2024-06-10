"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSheet = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizSheet extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.fields = ['id', 'no'];
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.sheet;
        this.isID = false;
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
        ret = Object.assign(Object.assign({}, ret), { io: this.io, main: this.main.name, details: this.details.map(v => {
                const { bin, caption } = v;
                return {
                    bin: bin.name,
                    caption, // 此处暂时不做res翻译
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