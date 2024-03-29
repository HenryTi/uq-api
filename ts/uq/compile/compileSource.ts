import { EntityRunner } from "../../core";
import { Compiler, CompilerThoroughly } from "./Compiler";

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

export async function compileBizThoroughly(runner: EntityRunner, unit: number, user: number) {
    const compiler = new CompilerThoroughly(runner, unit, user);
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

export async function compileDownload(runner: EntityRunner, unit: number, user: number, fileName: string) {
    const compiler = new Compiler(runner, unit, user);
    try {
        await compiler.loadBizObjects();
        compiler.parseBiz();
        compiler.scan();
        let ret = compiler.getSource(fileName);
        return ret;
    }
    catch (err) {
        return compiler.throwError(err);
    }
}
