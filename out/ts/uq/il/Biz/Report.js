"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizReport = exports.ReportJoinType = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
var ReportJoinType;
(function (ReportJoinType) {
    ReportJoinType[ReportJoinType["x"] = 1] = "x";
    ReportJoinType[ReportJoinType["to"] = 2] = "to";
})(ReportJoinType = exports.ReportJoinType || (exports.ReportJoinType = {}));
;
/*
export class ReportList extends BizBud {
    readonly dataType = BudDataType.none;
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        throw new Error("Method not implemented.");
    }
    atom: BizAtom | BizAtomSpec;

    buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        ret.atom = this.atom.name;
        return ret;
    }
}
*/
class BizReport extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.report;
        // readonly lists: ReportList[] = [];
        this.titles = [];
        this.joins = [];
    }
    parser(context) {
        return new parser_1.PBizReport(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        // const { title, bud } = this.title;
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
        /*
        ret.lists = this.lists.map(v => {
            return v.buildSchema(res);
        });
        */
        return ret;
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        /*
        let phrase = this.phrase;
        for (let list of this.lists) {
            list.buildPhrases(phrases, phrase)
        }
        */
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        // for (let list of this.lists) callback(list);
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud !== undefined)
            return bud;
        /*
        for (let kBud of this.lists) {
            if (kBud.name === name) return kBud;
        }
        */
        return undefined;
    }
    db(dbContext) {
        return new builder_1.BBizReport(dbContext, this);
    }
}
exports.BizReport = BizReport;
//# sourceMappingURL=Report.js.map