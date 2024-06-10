"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizReport = exports.ReportJoinType = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
var ReportJoinType;
(function (ReportJoinType) {
    ReportJoinType[ReportJoinType["x"] = 1] = "x";
    ReportJoinType[ReportJoinType["to"] = 2] = "to";
})(ReportJoinType || (exports.ReportJoinType = ReportJoinType = {}));
;
class BizReport extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.fields = [];
        this.isID = false;
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.report;
        this.titles = [];
        this.joins = [];
    }
    parser(context) {
        return new parser_1.PBizReport(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.title = this.titles.map(v => {
            const { caption, title, bud } = v;
            return {
                caption,
                title: [title.name, bud.name],
            };
        });
        ret.from = this.from.name;
        ret.joins = this.joins.map(v => {
            const { type, entity } = v;
            return {
                type,
                entity: entity.name,
            };
        });
        return ret;
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
    }
    forEachBud(callback) {
        super.forEachBud(callback);
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud !== undefined)
            return bud;
        return undefined;
    }
    db(dbContext) {
        return new builder_1.BBizReport(dbContext, this);
    }
}
exports.BizReport = BizReport;
//# sourceMappingURL=Report.js.map