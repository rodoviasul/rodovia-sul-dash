
import os
import mysql.connector
import pandas as pd
import boto3
import warnings
from sqlalchemy import create_engine
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Ignorar avisos do pandas sobre conexão direta
warnings.filterwarnings('ignore', category=UserWarning)

# Carregar variáveis de ambiente (localmente usa .env, no Kestra usa env vars)
load_dotenv()

# Configurações de conexão (Prioriza variáveis de ambiente do Kestra com prefixo RS)
DB_CONFIG = {
    'host': os.getenv('RODOVIASUL_HOST'),
    'port': int(os.getenv('RODOVIASUL_PORT', 3306)),
    'database': os.getenv('RODOVIASUL_DB'),
    'user': os.getenv('RODOVIASUL_USER'),
    'password': os.getenv('RODOVIASUL_PASSWORD'),
    'charset': 'utf8'
}

# Tabelas para processar
TABELAS = [
    'tabmovimento',
    'tabdespesas',
    'tabreceb',
    'tabfaturas',
    'tabclientes',
    'tabfornecedores',
    'tabcontas',
    'tabbancos',
    'tabfiliais'
]

# Configuração de Lotes (Batching) para não travar o banco
CHUNK_SIZE = 50000 

def exportar_para_parquet():
    """
    Lê tabelas do MySQL em lotes (batching), salva como Parquet e faz upload para o S3.
    """
    try:
        # Configurações do S3 (Supabase)
        s3_config = {
            'bucket': os.getenv('SUPABASE_BUCKET'),
            'access_key': os.getenv('AWS_ACCESS_KEY_ID'),
            'secret_key': os.getenv('AWS_SECRET_ACCESS_KEY'),
            'endpoint': os.getenv('SUPABASE_S3_ENDPOINT'),
            'region': os.getenv('AWS_DEFAULT_REGION', 'sa-east-1')
        }

        # Inicializar cliente S3
        s3_client = boto3.client(
            's3',
            aws_access_key_id=s3_config['access_key'],
            aws_secret_access_key=s3_config['secret_key'],
            endpoint_url=s3_config['endpoint'],
            region_name=s3_config['region']
        )

        # Conexão direta via mysql-connector
        conn = mysql.connector.connect(**DB_CONFIG)
        print(f"✅ Conectado ao banco: {DB_CONFIG['database']}")
        
        # Criar pasta para os parquets se não existir
        output_dir = "output_parquet"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"📂 Pasta '{output_dir}' criada.")

        for tabela in TABELAS:
            print(f"\n🚀 Iniciando extração total da tabela: {tabela}")
            try:
                # 1. Obter o total de linhas para monitorar progresso
                cursor = conn.cursor()
                cursor.execute(f"SELECT COUNT(*) FROM {tabela}")
                total_linhas = cursor.fetchone()[0]
                cursor.close()
                
                print(f"📊 Volume total: {total_linhas:,} registros")

                if total_linhas == 0:
                    print(f"⚠️ Tabela {tabela} está vazia. Pulando...")
                    continue

                # 2. Ler dados em lotes (Opção A: Segura para o banco)
                query = f"SELECT * FROM {tabela}"
                chunks = []
                linhas_lidas = 0
                
                # O pandas faz a leitura em lotes usando o chunksize
                for chunk in pd.read_sql(query, conn, chunksize=CHUNK_SIZE):
                    chunks.append(chunk)
                    linhas_lidas += len(chunk)
                    percentual = (linhas_lidas / total_linhas) * 100
                    print(f"   ⏳ Progresso: {linhas_lidas:,} / {total_linhas:,} ({percentual:.1f}%)")

                # 3. Consolidar lotes
                df_final = pd.concat(chunks, ignore_index=True)

                # 4. Salvar localmente
                file_path = os.path.join(output_dir, f"{tabela}.parquet")
                df_final.to_parquet(file_path, index=False, engine='pyarrow')
                print(f"✅ Parquet gerado localmente: {file_path}")

                # 5. Fazer upload para o S3
                s3_key = f"{tabela}.parquet"
                print(f"⬆️ Enviando para S3 (bucket: {s3_config['bucket']})...")
                s3_client.upload_file(file_path, s3_config['bucket'], s3_key)
                print(f"🎉 Upload de {tabela} concluído com sucesso!")
                
            except Exception as e:
                print(f"❌ Erro ao processar {tabela}: {e}")
        
        conn.close()
        print("\n🔒 Processo concluído e conexão MySQL fechada.")
                
    except Exception as e:
        print(f"❌ Erro geral na exportação: {e}")

if __name__ == "__main__":
    exportar_para_parquet()
