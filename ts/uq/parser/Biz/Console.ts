import { PBizBase, PBizEntity } from "./Base";
import { BizEntity, BizConsole, File, Folder } from '../../il';
import { BizEntitySpace } from "./Biz";
import { Token } from "../tokens";

export class PBizConsole extends PBizEntity<BizConsole> {
    protected readonly keyColl = {}
    protected _parse(): void {
        this.sourceStart = this.element.nameStartAt = this.ts.getP() - 1; //.sourceStart;
        this.ts.readToken();
        let name: string;
        if (this.ts.token === Token.DOLLARVAR) {
            this.sourceStart = this.element.nameStartAt = this.ts.getP() - 1; //.sourceStart;
            this.ts.readToken();
        }
        if (this.ts.token !== Token.LBRACE) {
            if (this.ts.token === Token.DOLLARVAR) {
                this.sourceStart = this.element.nameStartAt = this.ts.getP() - 1; //.sourceStart;
                this.ts.readToken();
            }
            else {
                this.ts.passToken(Token.SEMICOLON);
                return;
            }
        }
        this.element.name = '$console';
        this.ts.readToken();
        this.parseFolderContent(this.element.folder);
    }

    protected getNameInSource() {
        return '';
    }

    private parseFolderContent(folder: Folder) {
        for (; ;) {
            if (this.ts.token === Token.RBRACE as any) {
                this.ts.readToken();
                this.ts.mayPassToken(Token.SEMICOLON);
                break;
            }
            if (this.ts.token === Token.COLON) {
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
            if (this.ts.token === Token.LBRACE) {
                this.ts.readToken();
                let subFolder: Folder = {
                    name: name,
                    ui: ui,
                    folders: [],
                    files: [],
                }
                this.parseFolder(subFolder);
                folder.folders.push(subFolder);
            }
            else {
                let file: File = {
                    name,
                    ui,
                    entity: undefined,
                }
                folder.files.push(file);
                this.ts.passToken(Token.SEMICOLON);
            }
        }
    }

    private parseFolder(folder: Folder) {
        this.parseFolderContent(folder);
    }

    scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        if (this.scanFolder(space, this.element.folder) === false) {
            ok = false;
        }
        return ok;
    }

    private scanFolder(space: BizEntitySpace<BizEntity>, folder: Folder): boolean {
        let ok = true;
        for (let subFolder of folder.folders) {
            if (this.scanFolder(space, subFolder) === false) {
                ok = false;
            }
        }
        for (let file of folder.files) {
            let { name } = file;
            let { bizEntityArr: [entity] } = space.getBizEntityArr(name);
            if (entity === undefined) {
                this.log(`${name} is not defined`);
                ok = false;
            }
            file.entity = entity;
        }
        return ok;
    }
}
