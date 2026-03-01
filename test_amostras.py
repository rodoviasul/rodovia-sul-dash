
import os
from dotenv import load_dotenv
import pandas as pd
import mysql.connector

# Carregar variáveis de ambiente
load_dotenv()

# Configurações de conexão
DB_CONFIG = {
    'host': os.getenv('RODOVIASUL_HOST'),
    'port': int(os.getenv('RODOVIASUL_PORT', 3306)),
    'database': os.getenv('RODOVIASUL_DB'),
    'user': os.getenv('RODOVIASUL_USER'),
    'password': os.getenv('RODOVIASUL_PASSWORD'),
    'charset': 'utf8' # Tentando utf8 já que utf8mb4 falhou
}

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

def testar_amostras():
    try:
        # Conexão direta com mysql-connector
        conn = mysql.connector.connect(**DB_CONFIG)
        print(f"✅ Conectado ao banco: {DB_CONFIG['database']}")
        
        for tabela in TABELAS:
            print(f"\n🔍 Lendo as 10 primeiras linhas de: {tabela}")
            print("-" * 50)
            
            try:
                query = f"SELECT * FROM {tabela} LIMIT 10"
                # Usando pandas com a conexão direta
                df = pd.read_sql(query, conn)
                
                if df.empty:
                    print("⚠️ Tabela vazia")
                else:
                    print(df.to_string(index=False))
                    print(f"\n📊 Total retornado: {len(df)} linhas")
            except Exception as e:
                print(f"❌ Erro ao ler tabela {tabela}: {e}")
        
        conn.close()
                
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")

if __name__ == "__main__":
    testar_amostras()
