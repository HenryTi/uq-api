import { createDataType, OpCast } from "../../il";
import { PElement } from "../element";
import { Space } from "../space";
import { Token } from "../tokens";

export class POpCast extends PElement<OpCast>  {
    _parse() {
        if (this.ts.isKeyword('as') === false) this.expect("AS");
        this.ts.readToken();
        let dataType = createDataType(this.ts.lowerVar as any); //FieldType.ParseSimple(tokenStream);
        if (dataType === undefined) {
            this.expect('合法的数据类型');
        }
        this.ts.readToken();
        let parser = dataType.parser(this.context);
        parser.parse();
        if (this.ts.token != Token.RPARENTHESE) {
            this.expectToken(Token.RPARENTHESE);
        }
        this.ts.readToken();
        this.element.dataType = dataType;
    }

    scan(space: Space): boolean {
        let ok = true;
        let { dataType } = this.element;
        if (dataType) {
            if (dataType.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}