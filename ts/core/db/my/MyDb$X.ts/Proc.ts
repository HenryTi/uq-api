import { MyDb$X } from "./MyDb$X";

export abstract class Proc {
    abstract get name(): string;
    abstract get body(): string;
    async build(x: MyDb$X) {
        let { name } = x;
        let sql = `DROP PROCEDURE IF EXISTS ${name}.saveAtom;
        CREATE PROCEDURE ${name}.${this.name.toLowerCase()}${this.body};
`;
        x.sql(sql);
    }
}