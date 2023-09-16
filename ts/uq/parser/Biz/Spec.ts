import { BizAtom, BizAtomState, BizSpec } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizBase, PBizEntity } from "./Base";

export class PBizSpec extends PBizEntity<BizSpec> {
    protected get defaultName(): string { return undefined; }

    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
            key: this.parseKey,
            // assign: this.parseAssign,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === Token.RBRACE) break;
        }
    }

    protected parseKey = () => {
        let key = this.parseSubItem('key');
        this.element.keys.set(key.name, key);
    }

    protected isValidPropName(prop: string): boolean {
        return true;
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        let { keys } = this.element;
        let { size } = keys;
        if (size > 4) {
            this.log(`Spec '${this.element.name}' defined ${size} keys. Can not have more than 4 keys`);
            ok = false;
        }
        // this.element.buildFields();
        return ok;
    }
}
