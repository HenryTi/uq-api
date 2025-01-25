"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizQueryTableStatements = exports.BizQueryTable = exports.BizQueryValueStatements = exports.BizQueryValue = exports.BizQuery = void 0;
const BizQuery_1 = require("../../builder/Biz/BizQuery");
const parser_1 = require("../../parser");
const statement_1 = require("../statement");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizQuery extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.query;
    }
}
exports.BizQuery = BizQuery;
class BizQueryValue extends BizQuery {
    get type() { return 'queryvalue'; }
    parser(context) {
        return new parser_1.PBizQueryValue(this, context);
    }
    hasParam(name) {
        if (this.on === undefined)
            return false;
        return this.on.includes(name);
    }
}
exports.BizQueryValue = BizQueryValue;
class BizQueryValueStatements extends statement_1.Statements {
    parser(context) {
        return new parser_1.PBizQueryValueStatements(this, context);
    }
    db(db) {
        return;
    }
}
exports.BizQueryValueStatements = BizQueryValueStatements;
class BizQueryTable extends BizQuery {
    constructor() {
        super(...arguments);
        this.params = [];
    }
    get type() { return 'query'; }
    parser(context) {
        return new parser_1.PBizQueryTable(this, context);
    }
    hasParam(name) {
        let index = this.params.findIndex(v => v.name === name);
        return index >= 0;
    }
    hasReturn(prop) {
        let { cols, value } = this.from;
        let ret = (cols.findIndex(v => v.name === prop) >= 0);
        if (ret === true)
            return ret;
        if (prop === 'value' && value !== undefined)
            return true;
        return false;
    }
    db(dbContext) {
        return new BizQuery_1.BBizQuery(dbContext, this);
    }
    buildSchema(res) {
        var _a, _b;
        let ret = super.buildSchema(res);
        const { ban, cols, subCols, fromEntity, ids, showIds /*, groupByBase*/ } = this.from;
        ret.ids = ids.map(v => ({
            ui: v.ui,
            alias: v.fromEntity.alias,
            asc: v.asc,
        }));
        ret.showIds = showIds.map(v => ({
            ui: v.ui,
            alias: v.fromEntity.alias,
        }));
        if (ban !== undefined) {
            ret.ban = (_a = ban.caption) !== null && _a !== void 0 ? _a : true;
        }
        /*
        if (groupByBase === true) {
            ret.groupByBase = true;
        }
        */
        ret.params = this.params.map(v => v.buildSchema(res));
        let budCols = cols.filter(v => v.bud !== undefined);
        ret.cols = budCols.map(v => {
            const { bud, hide } = v;
            const { entity } = bud;
            let entityId = entity.id;
            if (hide === true)
                entityId = -entityId;
            return [entityId, bud.id];
        });
        if (subCols !== undefined) {
            ret.subCols = subCols.map(v => v.bud.id);
        }
        ret.from = this.buildFromSchema(fromEntity);
        const { value } = this.from;
        if (value !== undefined) {
            ret.value = (_b = value.bud) === null || _b === void 0 ? void 0 : _b.id;
        }
        return ret;
    }
    buildFromSchema(from) {
        const { bizEntityArr, bizPhraseType, subs, alias } = from;
        let subsSchema;
        if (subs !== undefined && subs.length > 0) {
            subsSchema = subs.map(v => this.buildFromSchema(v.fromEntity));
        }
        let ret = {
            arr: bizEntityArr.map(v => v.id),
            bizPhraseType,
            alias,
            subs: subsSchema,
        };
        return ret;
    }
}
exports.BizQueryTable = BizQueryTable;
class BizQueryTableStatements extends statement_1.Statements {
    parser(context) {
        return new parser_1.PBizQueryTableStatements(this, context);
    }
    db(db) {
        return;
    }
}
exports.BizQueryTableStatements = BizQueryTableStatements;
//# sourceMappingURL=Query.js.map