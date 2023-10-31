import { ValueExpression } from "../Exp";

export interface SetValue {
    name: string;
    equ: '=' | '-' | '+';
    value: ValueExpression;
}
