import { createDataProtoType, DataTypeDefine } from "../../il";
import { Token } from "../tokens";
import { PEntity } from "./entity";

export class PDataTypeDefine extends PEntity<DataTypeDefine> {
    protected _parse() {
        if (this.ts.token !== Token.LPARENTHESE) {
            this.ts.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        const { datatypes } = this.entity;
        for (; ;) {
            if (this.ts.token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }

            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            let name = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) this.expect('Data type');
            let type = this.ts.lowerVar;
            let dt = createDataProtoType(type);
            if (dt === undefined) {
                this.error(`unknown data type ${this.ts._var}`);
            }
            this.ts.readToken();
            dt.parser(this.context).parse();
            datatypes[name] = dt;
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
        }
    }
}
