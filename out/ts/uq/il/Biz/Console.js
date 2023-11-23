"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizConsole = void 0;
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizConsole extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.console;
        this.fields = [];
        this.folder = {
            name: '$',
            ui: undefined,
            folders: [],
            files: [],
        };
    }
    parser(context) {
        return new parser_1.PConsole(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.folder = this.buildFolderSchema(res, this.folder);
        return ret;
    }
    buildFolderSchema(res, folder) {
        const { name, ui, folders, files } = folder;
        let ret = {
            name,
            ui,
            folders: folders.map(v => this.buildFolderSchema(res, v)),
            files: files.map(v => v.name),
        };
        return ret;
    }
}
exports.BizConsole = BizConsole;
//# sourceMappingURL=Console.js.map