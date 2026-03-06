import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
    },
    eh: {
        mainModule: duckdb_wasm_eh,
        mainWorker: eh_worker,
    },
};

let db: duckdb.AsyncDuckDB | null = null;
let connection: duckdb.AsyncDuckDBConnection | null = null;
let initPromise: Promise<{ db: duckdb.AsyncDuckDB, connection: duckdb.AsyncDuckDBConnection }> | null = null;

export const initDuckDB = async () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // Select a bundle based on browser capabilities
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

        const worker = new Worker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();
        db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        connection = await db.connect();

        // Carregar extensões necessárias
        await connection.query("INSTALL httpfs; LOAD httpfs;");
        await connection.query("INSTALL json; LOAD json;");

        // Configuração S3 (Supabase)
        const accessKeyId = import.meta.env.VITE_S3_ACCESS_KEY_ID;
        const secretAccessKey = import.meta.env.VITE_S3_SECRET_ACCESS_KEY;
        const region = import.meta.env.VITE_S3_REGION;
        const endpoint = import.meta.env.VITE_S3_ENDPOINT;

        if (accessKeyId && secretAccessKey) {
            await connection.query(`
                SET s3_region='${region}';
                SET s3_access_key_id='${accessKeyId}';
                SET s3_secret_access_key='${secretAccessKey}';
                SET s3_endpoint='${endpoint.replace('https://', '')}';
                SET s3_use_ssl=true;
                SET s3_url_style='path';
            `);
        }

        return { db, connection };
    })();

    return initPromise;
};

export const registerTable = async (tableName: string, data: any[]) => {
    try {
        const { db, connection } = await initDuckDB();
        if (!db || !connection) throw new Error("DuckDB initialization failed");

        if (!data || data.length === 0) {
            console.warn(`⚠️ Tentativa de registrar tabela '${tableName}' com dados vazios.`);
            return;
        }

        // Limpa os dados para garantir que não haja referências circulares ou objetos complexos
        const cleanData = data.map(item => {
            const newItem: any = {};
            for (const key in item) {
                const val = item[key];
                if (val === null || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                    newItem[key] = val;
                } else if (val instanceof Date) {
                    newItem[key] = val.toISOString();
                } else {
                    newItem[key] = String(val);
                }
            }
            return newItem;
        });

        const jsonString = JSON.stringify(cleanData);
        const fileName = `${tableName}.json`;
        
        // Registra os dados como um arquivo virtual para evitar problemas de "Call Stack" com strings gigantes no SQL
        await db.registerFileText(fileName, jsonString);
        
        // Cria a tabela virtual a partir do arquivo registrado
        await connection.query(`
            CREATE OR REPLACE TABLE ${tableName} AS 
            SELECT * FROM read_json_auto('${fileName}')
        `);
    } catch (err) {
        console.error(`❌ Erro ao registrar tabela virtual '${tableName}':`, err);
        throw err;
    }
};

export const executeLocalQuery = async (sql: string): Promise<{ data: any[], columns: { name: string, type: string }[] }> => {
    const { connection } = await initDuckDB();
    if (!connection) throw new Error("DuckDB not initialized");

    // Ajusta a query para apontar para o S3 se necessário
    const bucket = import.meta.env.VITE_S3_BUCKET;
    const s3Path = `s3://${bucket}/`;
    const tablesToReplace = ['tabmovimento', 'tabreceb', 'tabdespesas', 'tabcontas', 'tabbancos'];
    
    let finalSql = sql;
    tablesToReplace.forEach(table => {
        const fromRegex = new RegExp(`FROM\\s+${table}`, 'gi');
        const joinRegex = new RegExp(`JOIN\\s+${table}`, 'gi');
        finalSql = finalSql.replace(fromRegex, `FROM '${s3Path}${table}.parquet'`);
        finalSql = finalSql.replace(joinRegex, `JOIN '${s3Path}${table}.parquet'`);
    });

    const result = await connection.query(finalSql);
    
    // Extrai tipos das colunas
    const columns = result.schema.fields.map(field => ({
        name: field.name,
        type: field.type.toString().split('<')[0].split('(')[0].toUpperCase() // Simplifica o tipo (ex: DECIMAL(18,3) -> DECIMAL)
    }));

    const data = result.toArray().map((row: any) => {
        const obj: any = {};
        for (const key of Object.keys(row)) {
            const val = row[key];
            const lowerKey = key.toLowerCase();
            
            // Converte BigInt para Number
            if (typeof val === 'bigint') {
                obj[key] = Number(val);
            } 
            // Converte objetos de Data para string ISO (YYYY-MM-DD) sem deslocamento de fuso
            else if (val instanceof Date) {
                const year = val.getUTCFullYear();
                const month = String(val.getUTCMonth() + 1).padStart(2, '0');
                const day = String(val.getUTCDate()).padStart(2, '0');
                obj[key] = `${year}-${month}-${day}`;
            }
            // Se for um número grande e a coluna sugerir data (ex: movdatacxa)
            else if (typeof val === 'number' && lowerKey.includes('data') && val > 1000000000000) {
                const date = new Date(val);
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                obj[key] = `${year}-${month}-${day}`;
            }
            else {
                obj[key] = val;
            }
        }
        return obj;
    });

    return { data, columns };
};
