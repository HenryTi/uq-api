import { EntityRunner } from "../../core";
import { Compiler } from "./Compiler";

export async function compileSingle(runner: EntityRunner, unit: number, user: number, id: number, code: string) {
    const compiler = new Compiler(runner, unit, user);
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
