import { Table } from "./Table";

export class TableA extends Table {
    readonly name = 'a';
    readonly body = `
time TIMESTAMP(6) NOT NULL,
uq INT(10) NULL DEFAULT NULL,
unit BIGINT(19) NULL DEFAULT NULL,
subject VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
content TEXT NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
PRIMARY KEY (time) USING BTREE
`;
}