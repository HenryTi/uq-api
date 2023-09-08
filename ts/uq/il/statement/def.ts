import { ValueExpression } from "../expression";

export interface SetValue {
    name: string;
    equ: '=' | '-' | '+';
    value: ValueExpression;
}
