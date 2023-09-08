import { IdBase } from "../../il/entity/IdBase";
import { Token } from "../tokens";
import { PEntityWithTable } from "./entity";

export abstract class PIdBase<T extends IdBase> extends PEntityWithTable<T> {
    protected parseStamp() {
        if (this.ts.token !== Token.LPARENTHESE) {
            this.ts.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
            if (this.ts.isKeyword('create') === true) {
                if (this.entity.stampCreate === true) {
                    this.ts.error('create stamp alread declared');
                }
                this.entity.stampCreate = true;
                this.ts.readToken();
            }
            else if (this.ts.isKeyword('update') === true) {
                if (this.entity.stampUpdate === true) {
                    this.ts.error('update stamp alread declared');
                }
                this.entity.stampUpdate = true;
                this.ts.readToken();
            }
            else {
                this.ts.error('stamp only create and update');
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
            }
            if (this.ts.token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
    }
}
