import { PBizConsole as PBizConsole, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { UI } from "../UI";
import { BizPhraseType } from "./BizPhraseType";
import { BizEntity } from "./Entity";

export class BizConsole extends BizEntity {
    readonly bizPhraseType = BizPhraseType.console;
    readonly fields = [];
    readonly folder: Folder = {
        name: '$',
        ui: undefined,
        folders: [],
        files: [],
    }

    parser(context: PContext): PElement<IElement> {
        return new PBizConsole(this, context);
    }

    buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        ret.folder = this.buildFolderSchema(res, this.folder);
        return ret;
    }

    private buildFolderSchema(res: { [phrase: string]: string; }, folder: Folder) {
        const { name, ui, folders, files } = folder;
        let ret = {
            name,
            ui,
            folders: folders.map(v => this.buildFolderSchema(res, v)),
            files: files.map(v => v.name),
        } as any;
        return ret;
    }
}

export interface File {
    name: string;
    ui: Partial<UI>;
    entity: BizEntity;
}

export interface Folder {
    name: string;
    ui: Partial<UI>;
    folders: Folder[];
    files: File[];
}