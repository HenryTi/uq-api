import { BizAtomID, BizPhraseType, BizTie, TieField } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizTie extends PBizEntity<BizTie> {
    private parseI = () => {
        this.parseTieField(this.element.i);
    }

    private parseX = () => {
        this.parseTieField(this.element.x);
    }

    private parseTieField(tieField: TieField) {
        tieField.caption = this.ts.mayPassString();
        tieField.atoms = this.parseAtoms() as any;
    }

    private parseAtoms() {
        let ret: string[] = [this.ts.passVar()];
        for (; ;) {
            if (this.ts.token !== Token.BITWISEOR as any) break;
            this.ts.readToken();
            ret.push(this.ts.passVar());
        }
        this.ts.passToken(Token.SEMICOLON);
        return ret;
    }

    readonly keyColl = {
        i: this.parseI,
        x: this.parseX,
    };

    scan(space: Space): boolean {
        let ok = true;
        let { i, x } = this.element;
        if (this.scanTieField(space, i) === false) ok = false;
        if (this.scanTieField(space, x) === false) ok = false;
        return ok;
    }

    private scanTieField(space: Space, tieField: TieField) {
        let ok = true;
        let atoms: BizAtomID[] = [];
        for (let name of tieField.atoms as unknown as string[]) {
            let bizEntity = space.getBizEntity(name);
            let { bizPhraseType } = bizEntity;
            if (bizPhraseType === BizPhraseType.atom || bizPhraseType === BizPhraseType.spec) {
                atoms.push(bizEntity as BizAtomID);
            }
            else {
                this.log(`${name} is neither ATOM nor SPEC`);
                ok = false;
            }
        }
        tieField.atoms = atoms;
        return ok;
    }
}
