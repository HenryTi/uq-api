"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizConsole = void 0;
const Base_1 = require("./Base");
const tokens_1 = require("../tokens");
class PBizConsole extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {};
    }
    _parse() {
        let p = this.ts.getP(); //.sourceStart;
        this.element.nameStartAt = p;
        this.sourceStart = p;
        this.ts.readToken();
        let name;
        if (this.ts.token === tokens_1.Token.DOLLARVAR) {
            name = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            name = '$console';
        }
        this.element.name = name;
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
                this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
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
            else {
                let file = {
                    name,
                    ui,
                    entity: undefined,
                };
                folder.files.push(file);
                this.ts.passToken(tokens_1.Token.SEMICOLON);
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
exports.PBizConsole = PBizConsole;
//# sourceMappingURL=Console.js.map