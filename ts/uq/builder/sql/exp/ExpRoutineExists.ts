import { ValueExpression } from "../../../il";
import { SqlBuilder } from "../sqlBuilder";
import { Exp } from "./Exp";
import { ExpVal } from "./exps";

// memo 1
export class ExpRoutineExists extends Exp {
    private readonly schema: ExpVal;
    private readonly routine: ExpVal;
    constructor(schema: ExpVal, routine: ExpVal) {
        super();
        this.schema = schema;
        this.routine = routine;
    }
    to(sb: SqlBuilder) {
        sb.append(`EXISTS(SELECT 1 FROM information_schema.routines WHERE ROUTINE_SCHEMA=`)
            .exp(this.schema)
            .append(` AND ROUTINE_NAME=`)
            .exp(this.routine)
            .r();
    }
}

export class ExpTableExists extends Exp {
    private readonly schema: ExpVal;
    private readonly name: ExpVal;
    constructor(schema: ExpVal, name: ExpVal) {
        super();
        this.schema = schema;
        this.name = name;
    }
    to(sb: SqlBuilder) {
        sb.append(`EXISTS(SELECT 1 FROM information_schema.tables WHERE TABLE_SCHEMA=`)
            .exp(this.schema)
            .append(` AND TABLE_NAME=`)
            .exp(this.name)
            .r();
    }
}
