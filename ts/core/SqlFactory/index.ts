import { SqlType } from "../../tool";
import { MySqlFactory } from "./MySqlFactory";
import { SqlFactory, SqlFactoryProps } from "./SqlFactory";

export function createSqlFactory(props: SqlFactoryProps): SqlFactory {
    switch (props.sqlType) {
        default: throw new Error('sql type other than mysql is not implemented');
        case SqlType.mysql: return new MySqlFactory(props);
    }
}
export { SqlFactory };
export { SqlBuilder } from './SqlBuilder';
