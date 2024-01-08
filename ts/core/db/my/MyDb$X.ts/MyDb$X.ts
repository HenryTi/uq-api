import { env } from "../../../../tool";
import { consts } from "../../../consts";
import { Db$X } from "../../Db";
import { MyDb } from "../MyDb";
import { MyDbs } from "../MyDbs";
import { Proc } from "./Proc";
import { ProcA } from "./ProcA";
import { Table } from "./Table";
import { TableA } from "./TableA";

const tables: (new () => Table)[] = [
    TableA,
];

const procs: (new () => Proc)[] = [
    ProcA,
];

export class MyDb$X extends MyDb implements Db$X {
    constructor(myDbs: MyDbs) {
        super(myDbs, consts.$x)
    }
    protected override initConfig(dbName: string) { return env.connection; }
    override async createDatabase(): Promise<void> {
        await super.createDatabase();
        await this.sql(`use ${this.name};`);

        for (let T of tables) {
            let t = new T();
            await t.build(this);
        }

        for (let P of procs) {
            let p = new P();
            await p.build(this);
        }
    }
}
