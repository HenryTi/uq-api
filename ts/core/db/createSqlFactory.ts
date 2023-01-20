import { env, SqlType } from "../../tool";
import { MySqlFactory } from "./my";
import { SqlFactory, SqlFactoryProps } from "./SqlFactory";

export function createSqlFactory(props: SqlFactoryProps): SqlFactory {
    switch (env.sqlType) {
        default: throw new Error('sql type other than mysql is not implemented');
        case SqlType.mysql: return new MySqlFactory(props);
    }
}
