"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizPick = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizPick extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.pick;
        this.fields = [];
        this.atoms = [];
        this.specs = [];
    }
    parser(context) {
        return new parser_1.PBizPick(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            atoms: this.atoms.map(v => v.name),
            specs: this.specs.map(v => v.name),
        });
    }
    db(dbContext) {
        return new builder_1.BBizPick(dbContext, this);
    }
}
exports.BizPick = BizPick;
//# sourceMappingURL=Pick.js.map