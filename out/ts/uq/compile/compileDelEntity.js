"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileDelEntity = void 0;
const Compiler_1 = require("./Compiler");
async function compileDelEntity(runner, unit, user, id) {
    const [{ code }] = await runner.tableFromProc('GetEntityCode', [unit, user, id]);
    const compiler = new Compiler_1.Compiler(runner, unit, user);
    try {
        await compiler.loadBizObjects();
        compiler.parseCode(code);
        compiler.parseBiz();
        compiler.delEntity(id);
        compiler.scan();
        return await compiler.buildDbResult();
    }
    catch (err) {
        return compiler.throwError(err);
    }
}
exports.compileDelEntity = compileDelEntity;
//# sourceMappingURL=compileDelEntity.js.map