"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileBiz = exports.compileSource = void 0;
const Compiler_1 = require("./Compiler");
async function compileSource(runner, unit, user, code) {
    const compiler = new Compiler_1.Compiler(runner, unit, user);
    try {
        await compiler.loadBizObjects();
        compiler.parseCode(code);
        compiler.parseBiz();
        compiler.scan();
        return await compiler.buildDbResult();
    }
    catch (err) {
        return compiler.throwError(err);
    }
}
exports.compileSource = compileSource;
async function compileBiz(runner, unit, user) {
    const compiler = new Compiler_1.Compiler(runner, unit, user);
    try {
        await compiler.loadBizObjects();
        compiler.parseBiz();
        compiler.scan();
        return await compiler.buildDbResult();
    }
    catch (err) {
        return compiler.throwError(err);
    }
}
exports.compileBiz = compileBiz;
//# sourceMappingURL=compileSource.js.map