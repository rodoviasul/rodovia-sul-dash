"""
Script de Exploração - Banco de Dados Rodovia Sul
Sistema: VCR Systems (MySQL)
Objetivo: Mapear estrutura e dados para construção do Dashboard Financeiro

⚠️  CONFIGURAÇÃO PARA GOOGLE COLAB - SEGURANÇA
    - Todas as queries têm LIMIT de 10 registros
    - Análise de período usa subquery limitada
    - Relacionamentos limitados a 5 registros
    - Evita carregamento de grandes volumes
"""
import os
from dotenv import load_dotenv
import mysql.connector
import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime
import warnings
from urllib.parse import quote_plus

# Carregar variáveis de ambiente
load_dotenv()

warnings.filterwarnings('ignore')

# ============================================================
# CONFIGURAÇÕES DE CONEXÃO
# ============================================================

DB_CONFIG = {
    'host': os.getenv('RODOVIASUL_HOST', '200.98.174.133'),
    'port': int(os.getenv('RODOVIASUL_PORT', 3306)),
    'database': os.getenv('RODOVIASUL_DB', 'rodoviasul'),
    'user': os.getenv('RODOVIASUL_USER', 'lucasbi'),
    'password': os.getenv('RODOVIASUL_PASSWORD', ''),
    'charset': 'utf8',
    'use_unicode': True
}

# Lista de tabelas disponíveis
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

# ============================================================
# CLASSE DE CONEXÃO
# ============================================================

class ExploradorRodoviaSul:
    """Classe para exploração do banco de dados"""
    
    def __init__(self, config):
        self.config = config
        self.conn = None
        self.engine = None
        
    def conectar(self):
        """Estabelece conexão com o banco"""
        try:
            self.conn = mysql.connector.connect(**self.config)
            print("✅ Conexão estabelecida com sucesso!")
            print(f"📊 Banco: {self.config['database']}")
            print(f"🔗 Host: {self.config['host']}")
            return True
        except mysql.connector.Error as err:
            print(f"❌ Erro na conexão: {err}")
            return False
    
    def criar_engine(self):
        """Cria engine SQLAlchemy"""
        encoded_password = quote_plus(self.config['password'])
        connection_string = (
            f"mysql+pymysql://{self.config['user']}:{encoded_password}"
            f"@{self.config['host']}:{self.config['port']}/{self.config['database']}?charset=utf8"
        )
        self.engine = create_engine(connection_string)
        return self.engine
    
    def descrever_tabela(self, nome_tabela):
        """Retorna estrutura da tabela"""
        try:
            query = f"DESCRIBE {nome_tabela}"
            df = pd.read_sql(query, self.conn)
            return df
        except Exception as e:
            print(f"❌ Erro ao descrever {nome_tabela}: {e}")
            return None
    
    def contar_registros(self, nome_tabela):
        """Conta registros na tabela"""
        try:
            query = f"SELECT COUNT(*) as total FROM {nome_tabela}"
            df = pd.read_sql(query, self.conn)
            return df['total'].iloc[0]
        except Exception as e:
            print(f"❌ Erro ao contar registros de {nome_tabela}: {e}")
            return 0
    
    def amostrar_dados(self, nome_tabela, limit=10):
        """Extrai amostra de dados"""
        try:
            query = f"SELECT * FROM {nome_tabela} LIMIT {limit}"
            df = pd.read_sql(query, self.conn)
            return df
        except Exception as e:
            print(f"❌ Erro ao amostrar {nome_tabela}: {e}")
            return None
    
    def executar_query(self, query):
        """Executa query genérica"""
        try:
            df = pd.read_sql(query, self.conn)
            return df
        except Exception as e:
            print(f"❌ Erro ao executar query: {e}")
            return None
    
    def fechar(self):
        """Fecha conexão"""
        if self.conn:
            self.conn.close()
            print("\n🔒 Conexão fechada")

# ============================================================
# FUNÇÕES DE ANÁLISE
# ============================================================

def analisar_estrutura_completa(explorador, tabelas):
    """Analisa estrutura de todas as tabelas"""
    print("\n" + "="*70)
    print("📋 ANÁLISE DE ESTRUTURA DAS TABELAS")
    print("="*70)
    
    estruturas = {}
    
    for tabela in tabelas:
        print(f"\n🔍 Analisando: {tabela}")
        print("-" * 70)
        
        # Descrever estrutura
        estrutura = explorador.descrever_tabela(tabela)
        if estrutura is not None:
            estruturas[tabela] = estrutura
            print(estrutura.to_string(index=False))
            
            # Contar registros - COM LIMITE DE SEGURANÇA
            total = explorador.contar_registros(tabela)
            print(f"\n📊 Total de registros: {total:,}")
            print(f"⚠️  Limite de extração: 10 registros (segurança Colab)")
        else:
            print(f"⚠️  Não foi possível acessar a tabela {tabela}")
    
    return estruturas

def analisar_amostras(explorador, tabelas, n=10):
    """Analisa amostras de dados - LIMITADO A 10 REGISTROS PARA SEGURANÇA"""
    print("\n" + "="*70)
    print("🔬 ANÁLISE DE AMOSTRAS DE DADOS (LIMITE: 10 REGISTROS)")
    print("="*70)
    
    for tabela in tabelas:
        print(f"\n📊 Primeiros {min(n, 10)} registros de: {tabela}")
        print("-" * 70)
        
        # Garantir que nunca passe de 10
        limite_seguro = min(n, 10)
        df = explorador.amostrar_dados(tabela, limit=limite_seguro)
        if df is not None and not df.empty:
            print(df.to_string(index=False))
            print(f"\nShape: {df.shape[0]} linhas x {df.shape[1]} colunas")
        else:
            print(f"⚠️  Tabela vazia ou inacessível")

def analisar_volume_dados(explorador, tabelas):
    """Analisa volume de dados em todas as tabelas"""
    print("\n" + "="*70)
    print("📈 ANÁLISE DE VOLUME DE DADOS")
    print("="*70)
    
    volumes = []
    for tabela in tabelas:
        total = explorador.contar_registros(tabela)
        volumes.append({'Tabela': tabela, 'Registros': total})
    
    df_volumes = pd.DataFrame(volumes)
    df_volumes = df_volumes.sort_values('Registros', ascending=False)
    print("\n", df_volumes.to_string(index=False))
    print(f"\n📊 Total geral: {df_volumes['Registros'].sum():,} registros")

def analisar_plano_contas(explorador):
    """Análise específica do plano de contas - LIMITADO A 10 REGISTROS"""
    print("\n" + "="*70)
    print("🏦 ANÁLISE DO PLANO DE CONTAS (LIMITE: 10 REGISTROS)")
    print("="*70)
    
    # Tentar visualizar estrutura do plano de contas - TODAS COM LIMIT 10
    queries = [
        "SELECT * FROM tabcontas LIMIT 10",
        "SELECT DISTINCT tipo FROM tabcontas LIMIT 10",
        "SELECT tipo, COUNT(*) as qtd FROM tabcontas GROUP BY tipo LIMIT 10"
    ]
    
    for i, query in enumerate(queries, 1):
        print(f"\n🔍 Query {i}: {query}")
        print("-" * 70)
        df = explorador.executar_query(query)
        if df is not None and not df.empty:
            print(df.to_string(index=False))
        else:
            print("⚠️  Sem resultados ou erro na query")

def analisar_periodo_dados(explorador):
    """Analisa período histórico disponível - LIMITADO A 10 REGISTROS"""
    print("\n" + "="*70)
    print("📅 ANÁLISE DE PERÍODO DOS DADOS (LIMITE: 10 REGISTROS)")
    print("="*70)
    
    # Lista de possíveis campos de data
    campos_data = ['data', 'data_emissao', 'data_lancamento', 'data_movimento', 
                   'data_vencimento', 'data_pagamento', 'data_recebimento']
    
    tabelas_datas = {
        'tabmovimento': ['data', 'data_movimento'],
        'tabdespesas': ['data', 'data_emissao', 'data_vencimento', 'data_pagamento'],
        'tabreceb': ['data', 'data_recebimento', 'data_emissao'],
        'tabfaturas': ['data_emissao', 'data_vencimento', 'data']
    }
    
    for tabela, campos in tabelas_datas.items():
        print(f"\n📊 Tabela: {tabela}")
        print("-" * 70)
        
        # Primeiro, descobrir quais campos existem
        estrutura = explorador.descrever_tabela(tabela)
        if estrutura is not None:
            campos_existentes = estrutura['Field'].tolist()
            
            # Tentar cada possível campo de data
            for campo in campos:
                if campo in campos_existentes:
                    # QUERY COM LIMIT 10 PARA SEGURANÇA
                    query = f"""
                    SELECT 
                        '{tabela}' as tabela,
                        '{campo}' as campo,
                        MIN({campo}) as data_inicio,
                        MAX({campo}) as data_fim,
                        COUNT(*) as total_registros
                    FROM (
                        SELECT {campo} FROM {tabela} WHERE {campo} IS NOT NULL LIMIT 10
                    ) as amostra
                    """
                    
                    df = explorador.executar_query(query)
                    if df is not None and not df.empty:
                        print(df.to_string(index=False))
                        print(f"⚠️  Análise baseada em amostra de até 10 registros")
                        break  # Achou um campo válido, passa para próxima tabela

def analisar_relacionamentos(explorador):
    """Tenta identificar relacionamentos entre tabelas - LIMITADO A 5 REGISTROS"""
    print("\n" + "="*70)
    print("🔗 ANÁLISE DE RELACIONAMENTOS (LIMITE: 5 REGISTROS)")
    print("="*70)
    
    # Possíveis relacionamentos - TODOS COM LIMIT 5
    testes = [
        {
            'nome': 'Despesas x Fornecedores',
            'query': """
                SELECT td.*, tf.nome as fornecedor
                FROM tabdespesas td
                LEFT JOIN tabfornecedores tf ON td.id_fornecedor = tf.id
                LIMIT 5
            """
        },
        {
            'nome': 'Receitas x Clientes',
            'query': """
                SELECT tr.*, tc.nome as cliente
                FROM tabreceb tr
                LEFT JOIN tabclientes tc ON tr.id_cliente = tc.id
                LIMIT 5
            """
        },
        {
            'nome': 'Faturas x Clientes',
            'query': """
                SELECT tf.*, tc.nome as cliente
                FROM tabfaturas tf
                LEFT JOIN tabclientes tc ON tf.id_cliente = tc.id
                LIMIT 5
            """
        }
    ]
    
    for teste in testes:
        print(f"\n🔍 Testando: {teste['nome']}")
        print("-" * 70)
        
        df = explorador.executar_query(teste['query'])
        if df is not None and not df.empty:
            print("✅ Relacionamento encontrado!")
            print(df.to_string(index=False))
        else:
            print("⚠️  Relacionamento não identificado ou campos diferentes")

def gerar_relatorio_final(explorador, estruturas):
    """Gera relatório consolidado da exploração"""
    print("\n" + "="*70)
    print("📋 RELATÓRIO FINAL DE EXPLORAÇÃO")
    print("="*70)
    
    print("\n✅ RESUMO EXECUTIVO:")
    print("-" * 70)
    
    # Contar total de tabelas exploradas
    print(f"📊 Total de tabelas analisadas: {len(estruturas)}")
    
    # Total de campos
    total_campos = sum(len(df) for df in estruturas.values())
    print(f"📝 Total de campos mapeados: {total_campos}")
    
    # Identificar campos críticos
    print("\n🎯 CAMPOS CRÍTICOS IDENTIFICADOS:")
    print("-" * 70)
    
    campos_criticos = {
        'Datas': [],
        'Valores': [],
        'Chaves': [],
        'Classificações': []
    }
    
    for tabela, estrutura in estruturas.items():
        for _, row in estrutura.iterrows():
            # Garantir que o nome do campo seja string (pode vir como bytes em alguns casos)
            campo_raw = row['Field']
            campo = (campo_raw.decode('utf-8') if isinstance(campo_raw, bytes) else str(campo_raw)).lower()
            
            if 'data' in campo:
                campos_criticos['Datas'].append(f"{tabela}.{campo_raw}")
            if 'valor' in campo or 'vlr' in campo:
                campos_criticos['Valores'].append(f"{tabela}.{campo_raw}")
            if campo.startswith('id_') or campo.endswith('_id'):
                campos_criticos['Chaves'].append(f"{tabela}.{campo_raw}")
            if 'tipo' in campo or 'categoria' in campo or 'classe' in campo:
                campos_criticos['Classificações'].append(f"{tabela}.{campo_raw}")
    
    for categoria, campos in campos_criticos.items():
        if campos:
            print(f"\n{categoria}:")
            for campo in campos[:10]:  # Limitar a 10 para não poluir
                print(f"  • {campo}")
            if len(campos) > 10:
                print(f"  ... e mais {len(campos) - 10} campos")
    
    print("\n" + "="*70)
    print("✅ EXPLORAÇÃO CONCLUÍDA!")
    print("="*70)
    print("\n📝 Próximos passos:")
    print("  1. Revisar estruturas identificadas")
    print("  2. Validar relacionamentos com equipe técnica")
    print("  3. Confirmar campos de data e valor com contador")
    print("  4. Mapear plano de contas para estrutura DRE")
    print("  5. Iniciar desenvolvimento do ETL")

# ============================================================
# FUNÇÃO PRINCIPAL
# ============================================================

def main():
    """Executa exploração completa do banco"""
    
    print("="*70)
    print("🔍 EXPLORAÇÃO DO BANCO DE DADOS - RODOVIA SUL")
    print("="*70)
    print(f"📅 Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"👤 Usuário: {DB_CONFIG['user']}")
    print(f"🏢 Banco: {DB_CONFIG['database']}")
    
    # Criar explorador
    explorador = ExploradorRodoviaSul(DB_CONFIG)
    
    # Conectar
    if not explorador.conectar():
        print("\n❌ Não foi possível conectar ao banco. Verifique as credenciais.")
        return
    
    # Criar engine
    explorador.criar_engine()
    
    try:
        # 1. Analisar estrutura
        estruturas = analisar_estrutura_completa(explorador, TABELAS)
        
        # 2. Analisar volume
        analisar_volume_dados(explorador, TABELAS)
        
        # 3. Analisar amostras - LIMITE DE 10 PARA SEGURANÇA
        analisar_amostras(explorador, TABELAS, n=10)
        
        # 4. Analisar plano de contas
        analisar_plano_contas(explorador)
        
        # 5. Analisar período
        analisar_periodo_dados(explorador)
        
        # 6. Analisar relacionamentos
        analisar_relacionamentos(explorador)
        
        # 7. Gerar relatório final
        gerar_relatorio_final(explorador, estruturas)
        
    except Exception as e:
        print(f"\n❌ Erro durante exploração: {e}")
    
    finally:
        # Fechar conexão
        explorador.fechar()

# ============================================================
# EXECUÇÃO
# ============================================================

if __name__ == "__main__":
    # ⚠️ IMPORTANTE: Configure a senha antes de executar
    if not DB_CONFIG['password']:
        print("\n⚠️  ATENÇÃO: Configure a senha do banco antes de executar!")
        print("   Edite a variável DB_CONFIG['password'] no início do script")
        print("   Ou utilize variáveis de ambiente para maior segurança")
    else:
        main()
