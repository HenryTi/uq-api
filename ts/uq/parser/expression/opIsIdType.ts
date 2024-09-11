import { OpIsIdType } from "../../il";
import { PElement } from "../element";
import { Space } from "../space";
import { Token } from "../tokens";

export class POpIsIdType extends PElement<OpIsIdType> {
    private ids: string[];
    _parse() {
        this.ids = []
        for (; ;) {
            this.ids.push(this.ts.lowerVar);
            this.ts.readToken();
            if (this.ts.token !== Token.BITWISEOR as any) {
                break;
            }
            this.ts.readToken();
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        for (let id of this.ids) {
            let entity = space.uq.biz.bizEntities.get(id);
            if (entity === undefined) {
                ok = false;
                this.log(`${id} is not defined`);
                continue;
            }
            else {
                this.element.bizEntities.push(entity);
            }
        }
        return ok;
    }
}
