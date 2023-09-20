import { env } from "../../../tool";
import { consts } from "../../consts";
import { Db$Site } from "../Db";
import { MyDb } from "./MyDb";
import { MyDbs } from "./MyDbs";

export class MyDb$Site extends MyDb implements Db$Site {
    constructor(myDbs: MyDbs) {
        super(myDbs, consts.$site)
    }
    protected override initConfig(dbName: string) { return env.connection; }
    override async createDatabase(): Promise<void> {
        await Promise.all([
            super.createDatabase(),
            this.buildProcSaveAtom(),
        ]);
    }

    private async buildProcSaveAtom() {
        const { $site } = consts;
        const sql = `
        DROP PROCEDURE IF EXISTS ${$site}.saveAtom;
        CREATE PROCEDURE ${$site}.saveAtom(db VARCHAR(200), site BIGINT, atomPhrase VARCHAR(200), base BIGINT, keys0 VARCHAR(500), ex VARCHAR(200))
BEGIN
    IF EXISTS(SELECT routine_name
        FROM information_schema.routines 
        WHERE routine_schema='${$site}' AND routine_name=CONCAT(site, '$SaveAtom'))
    THEN
        SET @sql=CONCAT('${$site}.', site, '$');
    ELSE
        SET @sql=CONCAT(db, '.');
    END IF;
	SET @sql = concat('call ', @sql, 'SaveAtom(?,?,?,?)');
    PREPARE stmt FROM @sql;
    SET @atomPhrase=atomPhrase;
    SET @base=base;
    SET @keys0=keys0;
    SET @ex=ex;
    EXECUTE stmt USING @atomPhrase, @base, @keys0, @ex;
    DEALLOCATE PREPARE stmt;
END;
`;
        this.sql(sql, undefined);
    }
}
