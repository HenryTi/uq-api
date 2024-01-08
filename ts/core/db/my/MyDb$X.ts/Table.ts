import { MyDb$X } from "./MyDb$X";

export abstract class Table {
    abstract get name(): string;
    abstract get body(): string;
    async build(x: MyDb$X) {
        let { name } = x;
        let sql = `CREATE TABLE IF NOT EXISTS ${name}.${this.name.toLowerCase()}(${this.body});`;
        x.sql(sql);
    }
}

