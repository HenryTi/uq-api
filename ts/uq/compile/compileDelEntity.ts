import { EntityRunner } from "../../core";
import { Compiler } from "./Compiler";

export async function compileDelEntity(runner: EntityRunner, unit: number, user: number, id: number) {
    const [{ code }] = await runner.tableFromProc('GetEntityCode', [unit, user, id]);
    const compiler = new Compiler(runner, unit, user);
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
