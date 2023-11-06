"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpRoutineExists = void 0;
const Exp_1 = require("./Exp");
// memo 1
class ExpRoutineExists extends Exp_1.Exp {
    constructor(schema, routine) {
        super();
        this.schema = schema;
        this.routine = routine;
    }
    to(sb) {
        const { factory } = sb;
        sb.append(`EXISTS(SELECT 1 FROM information_schema.routines WHERE ROUTINE_SCHEMA=`)
            .exp(this.schema)
            .append(` AND ROUTINE_NAME=`)
            .exp(this.routine)
            .r();
    }
}
exports.ExpRoutineExists = ExpRoutineExists;
//# sourceMappingURL=ExpRoutineExists.js.map