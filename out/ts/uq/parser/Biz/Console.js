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
        this.sourceStart = this.element.nameStartAt = this.ts.getP() - 1; //.sourceStart;
        this.ts.readToken();
        let name;
        if (this.ts.token === tokens_1.Token.DOLLARVAR) {
            this.sourceStart = this.element.nameStartAt = this.ts.getP() - 1; //.sourceStart;
            this.ts.readToken();
        }
        if (this.ts.token !== tokens_1.Token.LBRACE) {
            if (this.ts.token === tokens_1.Token.DOLLARVAR) {
                this.sourceStart = this.element.nameStartAt = this.ts.getP() - 1; //.sourceStart;
                this.ts.readToken();
            }
            else {
                this.ts.passToken(tokens_1.Token.SEMICOLON);
                return;
            }
        }
        this.element.name = '$console';
        this.ts.readToken();
        this.parseFolderContent(this.element.folder);
    }
    getNameInSource() {
        return '';
    }
    parseFolderContent(folder) {
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE) {
                this.ts.readToken();
                this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
                break;
            }
            if (this.ts.token === tokens_1.Token.COLON) {
                if (this.element.user !== undefined) {
                    this.ts.error(': duplicate');
                }
                this.ts.readToken();
                this.ts.passKey('user');
                this.parseBizUser();
                continue;
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
        if (super.scan(space) === false) {
            ok = false;
        }
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
            let { bizEntityArr: [entity] } = space.getBizFromEntityArrFromName(name);
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