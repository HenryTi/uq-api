import { EntityRunner, $resDb } from "../core";

export async function create$ResDb() {
    await $resDb.createDatabase();
}

let resDbRunner: EntityRunner;
export async function getResDbRunner(): Promise<EntityRunner> {
    if (resDbRunner === undefined) {
        resDbRunner = new EntityRunner($resDb);
    }
    return resDbRunner;
}
