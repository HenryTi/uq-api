import { EntityRunner } from "../../core";
import { Compiler } from "./Compiler";

export async function compileRename(runner: EntityRunner, unit: number, user: number, id: number, entityName: string) {
    const compiler = new Compiler(runner, unit, user);
    try {
        await compiler.loadBizObjects();
        let newCode = compiler.changeName(id, entityName);
        if (newCode === undefined) {
            return {
                hasError: true,
                logs: ['不能改实体名，也不能新增实体'],
            }
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
