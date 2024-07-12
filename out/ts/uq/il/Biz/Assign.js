"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizAssign = void 0;
const builder_1 = require("../../builder");
const Assign_1 = require("../../parser/Biz/Assign");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizAssign extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.assign;
        this.fields = [];
        this.atom = [];
        this.title = []; // of BizTitle buds
    }
    parser(context) {
        return new Assign_1.PBizAssign(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.atom = this.atom.map(v => v.name);
        ret.title = this.title.map(([entity, bud]) => ([entity.id, bud.id]));
        return ret;
    }
    db(dbContext) {
        return new builder_1.BBizAssign(dbContext, this);
    }
}
exports.BizAssign = BizAssign;
//# sourceMappingURL=Assign.js.map