import { BizIDExtendable, BizTie, IxField } from "../../il";
import { BizPhraseType } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizTie extends PBizEntity<BizTie> {
    private parseI = () => {
        this.parseIxField(this.element.i);
    }

    private parseX = () => {
        this.parseIxField(this.element.x);
    }

    readonly keyColl = {
        i: this.parseI,
        x: this.parseX,
    };

    scan(space: Space): boolean {
        let ok = true;
        let { i, x } = this.element;
        if (this.scanIxField(space, i) === false) ok = false;
        if (this.scanIxField(space, x) === false) {
            ok = false;
        }
        else {
            if (x.atoms === undefined) {
                this.log(`TIE X can not be ME`);
                ok = false;
            }
        }
        return ok;
    }
}
