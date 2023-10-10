"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileRenameEntity = void 0;
const Compiler_1 = require("./Compiler");
const UqParser_1 = require("./UqParser");
async function compileRenameEntity(runner, unit, user, id, entityName) {
    const [{ code }] = await runner.tableFromProc('GetEntityCode', [unit, user, id]);
    const compiler = new Compiler_1.Compiler(runner, unit, user);
    const uqParser = new UqParser_1.UqParser(compiler);
    uqParser.parse(code, 'upload');
    let entity = uqParser.uq.biz.bizArr[0];
    let p = entity.nameStartAt;
    let c = code;
    c = c.substring(0, p) + entityName + c.substring(p + entityName.length);
    let [ret] = await runner.unitUserTablesFromProc('RenameEntity', unit, user, id, entityName, c);
    return {
        ok: ret !== undefined,
    };
    /*
    try {
        await compiler.loadBizObjects();
        let ret = compiler.parseCode(code);
        if (ret !== undefined) return ret;
        compiler.parseBiz();
        return await compiler.scanAndBuildDb();
    }
    catch (err) {
        return compiler.errorResult(err);
    }
    */
}
exports.compileRenameEntity = compileRenameEntity;
//# sourceMappingURL=compileRenameEntity.js.map