import { SqlBuilder } from "../sqlBuilder";

// Exp
export abstract class Exp {
    abstract to(sb: SqlBuilder): void;
    get voided(): boolean { return false; }
}
