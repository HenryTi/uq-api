import { env } from "../../../tool";
import { DbNoName } from "../Db";
import { MyDbBase } from "./MyDbBase";

export class MyDbNoName extends MyDbBase implements DbNoName {
    protected override initConfig(dbName: string) { return env.connection; }
}
