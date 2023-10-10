"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileSingle = void 0;
const Compiler_1 = require("./Compiler");
async function compileSingle(runner, unit, user, id, code) {
    const compiler = new Compiler_1.Compiler(runner, unit, user);
    try {
        await compiler.loadBizObjects();
        compiler.parseCode(code);
        if (compiler.checkSingle(id) === false) {
            return compiler.errorResult();
        }
        compiler.parseBiz();
        compiler.scan();
        return await compiler.buildDbResult();
    }
    catch (err) {
        return compiler.throwError(err);
    }
}
exports.compileSingle = compileSingle;
//# sourceMappingURL=compileSingle.js.map