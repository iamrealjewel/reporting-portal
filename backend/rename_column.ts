import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const dbUrl = process.env.DATABASE_URL;

async function main() {
    if (!dbUrl) {
        console.error('DATABASE_URL not found in .env');
        return;
    }

    // Parse DB URL: mysql://user:pass@host:port/db
    // Handles cases with or without special characters better.
    let url;
    try {
        url = new URL(dbUrl);
    } catch (e) {
        console.error('Invalid DATABASE_URL');
        return;
    }

    const host = url.hostname;
    const port = parseInt(url.port || '3306');
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const database = url.pathname.substring(1);

    const connection = await mysql.createConnection({
        host,
        user,
        password,
        port,
        database
    });

    try {
        console.log(`Renaming column 'group' to 'prodLine' in 'Stock' table...`);
        // Note: 'group' is a reserved word in MySQL, so it MUST be backticked.
        await connection.execute('ALTER TABLE `Stock` CHANGE COLUMN `group` `prodLine` VARCHAR(191) NULL');
        console.log('Column renamed successfully.');

        // Check if there is an index to rename
        try {
            await connection.execute('ALTER TABLE `Stock` RENAME INDEX `Stock_group_idx` TO `Stock_prodLine_idx`');
            console.log('Index renamed successfully.');
        } catch (e) {
            console.log('Index RENAME INDEX Stock_group_idx TO Stock_prodLine_idx failed (might not exist or different name). Skipping...');
        }

    } catch (error) {
        console.error('Error during rename:', error);
    } finally {
        await connection.end();
    }
}

main();
