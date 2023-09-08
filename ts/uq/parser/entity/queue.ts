import { Queue } from "../../il";
import { PEntity } from "./entity";

export class PQueue extends PEntity<Queue> {
    scanDoc2(): boolean {
        return true;
    }
    protected _parse() {
        this.setName();
        if (this.ts.isKeyword('asc') === true) {
            this.ts.readToken();
            this.entity.orderBy = 'asc';
        }
        else if (this.ts.isKeyword('desc') === true) {
            this.ts.readToken();
            this.entity.orderBy = 'desc';
        }
        if (this.ts.isKeyword('once') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('only') === false) {
                this.ts.expect('ONLY');
            }
            this.ts.readToken();
            this.entity.onceOnly = true;
        };
    }
}
