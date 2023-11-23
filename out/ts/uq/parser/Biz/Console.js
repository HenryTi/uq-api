"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PConsole = void 0;
const Base_1 = require("./Base");
const tokens_1 = require("../tokens");
class PConsole extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {};
    }
    _parse() {
        let name;
        if (this.ts.token === tokens_1.Token.DOLLARVAR) {
            name = this.ts.lowerVar;
            this.ts.readToken();
        }
        this.element.name = name !== null && name !== void 0 ? name : '$console';
        if (this.ts.token !== tokens_1.Token.LBRACE) {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
            return;
        }
        this.ts.readToken();
        this.parseFolderContent(this.element.folder);
    }
    parseFolderContent(folder) {
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE) {
                this.ts.readToken();
                break;
            }
            let name = this.ts.passVar();
            let ui = this.parseUI();
            if (this.ts.token === tokens_1.Token.LBRACE) {
                this.ts.readToken();
                let subFolder = {
                    name: name,
                    ui: ui,
                    folders: [],
                    files: [],
                };
                this.parseFolder(subFolder);
                folder.folders.push(subFolder);
            }
            else if (this.ts.token === tokens_1.Token.SEMICOLON) {
                this.ts.readToken();
                let file = {
                    name,
                    ui,
                    entity: undefined,
                };
                file.ui = this.parseUI();
                folder.files.push(file);
            }
            else {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
        }
    }
    parseFolder(folder) {
        this.parseFolderContent(folder);
    }
    scan(space) {
        let ok = true;
        if (this.scanFolder(space, this.element.folder) === false) {
            ok = false;
        }
        return ok;
    }
    scanFolder(space, folder) {
        let ok = true;
        for (let subFolder of folder.folders) {
            if (this.scanFolder(space, subFolder) === false) {
                ok = false;
            }
        }
        for (let file of folder.files) {
            let { name } = file;
            let entity = space.getBizEntity(name);
            if (entity === undefined) {
                this.log(`${name} is not defined`);
                ok = false;
            }
            file.entity = entity;
        }
        return ok;
    }
}
exports.PConsole = PConsole;
//# sourceMappingURL=Console.js.map