"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileRename = void 0;
const Compiler_1 = require("./Compiler");
async function compileRename(runner, unit, user, id, entityName) {
    const compiler = new Compiler_1.Compiler(runner, unit, user);
    try {
        await compiler.loadBizObjects();
        let newCode = compiler.changeName(id, entityName);
        if (newCode === undefined) {
            return {
                hasError: true,
                logs: ['不能改实体名，也不能新增实体'],
            };
        }
        compiler.parseBiz();
        compiler.scan();
        await runner.call('RenameEntity', [unit, user, id, entityName, newCode]);
        return await compiler.buildDbResult();
    }
    catch (err) {
        return compiler.throwError(err);
    }
}
exports.compileRename = compileRename;
//# sourceMappingURL=compileRename.js.map