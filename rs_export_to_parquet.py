
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

def exportar_para_parquet():
    """
    Lê tabelas do MySQL, salva como Parquet e faz upload para o S3 do Supabase.
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

        # Lista para armazenar metadados das tabelas
        metadados_lista = []

        for tabela in TABELAS:
            print(f"\n🚀 Processando tabela: {tabela}")
            try:
                # Query com LIMIT 10 para teste de integração
                query = f"SELECT * FROM {tabela} LIMIT 10"
                
                # Ler dados usando pandas
                df = pd.read_sql(query, conn)
                
                if df.empty:
                    print(f"⚠️ Tabela {tabela} está vazia. Pulando...")
                    continue

                # Nome do arquivo de saída
                file_path = os.path.join(output_dir, f"{tabela}.parquet")
                
                # Salvar em Parquet
                df.to_parquet(file_path, index=False, engine='pyarrow')
                print(f"✅ Salvo localmente: {file_path}")

                # Adicionar aos metadados
                metadados_lista.append({
                    'tabela': tabela,
                    'colunas': len(df.columns),
                    'linhas': len(df)
                })

                # Fazer upload para o S3
                s3_key = f"{tabela}.parquet" # Salva diretamente na raiz do bucket 'parquet'
                print(f"⬆️ Iniciando upload de {tabela} para S3 (bucket: {s3_config['bucket']})...")
                s3_client.upload_file(file_path, s3_config['bucket'], s3_key)
                print(f"🎉 Upload concluído: {s3_key}")
                
            except Exception as e:
                print(f"❌ Erro ao processar {tabela}: {e}")
        
        # ------------------------------------------------------------
        # Gerar e enviar o arquivo de resumo (metadados)
        # ------------------------------------------------------------
        if metadados_lista:
            print(f"\n📊 Gerando arquivo de resumo: tabelas.parquet")
            df_resumo = pd.DataFrame(metadados_lista)
            resumo_path = os.path.join(output_dir, "tabelas.parquet")
            df_resumo.to_parquet(resumo_path, index=False, engine='pyarrow')
            
            print(f"⬆️ Enviando resumo para S3...")
            s3_client.upload_file(resumo_path, s3_config['bucket'], "tabelas.parquet")
            print(f"🎉 Resumo enviado com sucesso!")

        conn.close()
        print("\n🔒 Processo concluído e conexão fechada.")
                
    except Exception as e:
        print(f"❌ Erro geral na exportação: {e}")

if __name__ == "__main__":
    exportar_para_parquet()
