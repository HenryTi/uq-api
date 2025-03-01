import { SheetState, UI } from "../../il";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";
import { BizEntitySpace } from "./Biz";

export class PSheetState extends PBizEntity<SheetState> {
    private parseMain = () => {

    }

    private parseDetail = () => {

    }

    private parseAct = () => {

    }

    readonly keyColl: { [key: string]: () => void; } = {
        main: this.parseMain,
        detail: this.parseDetail,
        act: this.parseAct,
    }

    protected parseHeader() {
        this.element.name = this.ts.token === Token.VAR ?
            this.ts.passVar() : '$';
        this.element.ui = this.parseUI();
    }

    scan(space: BizEntitySpace): boolean {
        let ok = true;
        return ok;
    }
}
