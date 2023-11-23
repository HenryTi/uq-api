import { PBizBase, PBizEntity } from "./Base";
import { BizEntity, BizConsole, File, Folder } from '../../il';
import { BizEntitySpace } from "./Biz";
import { Token } from "../tokens";

export class PConsole extends PBizEntity<BizConsole> {
    protected readonly keyColl = {}
    protected _parse(): void {
        let name: string;
        if (this.ts.token === Token.DOLLARVAR) {
            name = this.ts.lowerVar;
            this.ts.readToken();
        }
        this.element.name = name ?? '$console';
        if (this.ts.token !== Token.LBRACE) {
            this.ts.passToken(Token.SEMICOLON);
            return;
        }
        this.ts.readToken();
        this.parseFolderContent(this.element.folder);
    }

    private parseFolderContent(folder: Folder) {
        for (; ;) {
            if (this.ts.token === Token.RBRACE as any) {
                this.ts.readToken();
                break;
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
            else if (this.ts.token === Token.SEMICOLON) {
                this.ts.readToken();
                let file: File = {
                    name,
                    ui,
                    entity: undefined,
                }
                file.ui = this.parseUI();
                folder.files.push(file);
            }
            else {
                this.ts.expectToken(Token.VAR);
            }
        }
    }

    private parseFolder(folder: Folder) {
        this.parseFolderContent(folder);
    }

    scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = true;
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
