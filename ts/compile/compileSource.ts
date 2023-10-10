import { EntityRunner } from "../core";
import { Compiler } from "./Compiler";

export async function compileSource(runner: EntityRunner, unit: number, user: number, code: string) {
    const compiler = new Compiler(runner, unit, user);
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

export async function compileBiz(runner: EntityRunner, unit: number, user: number) {
    const compiler = new Compiler(runner, unit, user);
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
