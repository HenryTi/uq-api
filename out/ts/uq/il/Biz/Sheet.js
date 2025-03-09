"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinStateAct = exports.BinState = exports.SheetState = exports.BizSheet = exports.EnumDetailOperate = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const Bin_1 = require("./Bin");
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
        this.fields = BizSheet.ownFields; // ['id', 'no'];
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
        let states;
        if (this.states !== undefined) {
            states = this.states.map(v => v.buildSchema(res));
        }
        ret = Object.assign(Object.assign({}, ret), { io: this.io, main: this.main.id, details: this.details.map(v => {
                const { bin, caption, operate } = v;
                return {
                    bin: bin.id,
                    caption, // 此处暂时不做res翻译
                    operate,
                };
            }), search,
            states });
        return ret;
    }
    db(dbContext) {
        return new builder_1.BBizSheet(dbContext, this);
    }
    checkUserProp(prop) {
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        if (this.states !== undefined) {
            for (let state of this.states) {
                state.buildPhrases(phrases, this.name);
            }
        }
    }
    forEachState(callback) {
        if (this.states === undefined)
            return;
        for (let state of this.states) {
            callback(state);
        }
    }
}
exports.BizSheet = BizSheet;
BizSheet.ownFields = ['id', 'no', 'operator'];
class SheetState extends Entity_1.BizNotID {
    constructor(sheet) {
        super(sheet.biz);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.sheetState;
        this.details = [];
        this.sheet = sheet;
    }
    parser(context) {
        return new parser_1.PSheetState(this, context);
    }
    buildPhrase(prefix) {
        this.phrase = `${prefix}.${this.name}`;
    }
    buildPhrases(phrases, prefix) {
        var _a;
        this.buildPhrase(prefix);
        let phrase = this.phrase;
        this.forEachBud(bud => {
            bud.buildPhrases(phrases, phrase);
        });
        phrases.push([this.phrase, (_a = this.ui.caption) !== null && _a !== void 0 ? _a : '', this.extendsPhrase, this.typeNum]);
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        ret.main = (_a = this.main) === null || _a === void 0 ? void 0 : _a.buildSchema(res);
        ret.details = this.details.map(v => v.buildSchema(res));
        return ret;
    }
}
exports.SheetState = SheetState;
class BinState extends Bin_1.BizBinBase {
    constructor(sheetState) {
        super(sheetState.biz);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.binState;
        this.fields = ['id'];
        this.main = undefined;
        this.sheetState = sheetState;
    }
    parser(context) {
        return new parser_1.PBinState(this, context);
    }
    buildSchema(res) {
        var _a;
        let ret = {
            id: this.bin.id,
            edit: (_a = this.edit) === null || _a === void 0 ? void 0 : _a.map(v => v.id),
        };
        return ret;
    }
}
exports.BinState = BinState;
class BinStateAct extends Bin_1.BizBinBaseAct {
    constructor(binState) {
        super(binState.biz, binState);
        this.binState = binState;
    }
    parser(context) {
        return new parser_1.PBinStateAct(this, context);
    }
}
exports.BinStateAct = BinStateAct;
//# sourceMappingURL=Sheet.js.map