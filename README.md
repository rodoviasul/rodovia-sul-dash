# Rodovia Sul - ETL & Data Exploration

Este repositório contém as ferramentas para extração, exploração e carregamento (ETL) dos dados do banco de dados MySQL da **Rodovia Sul** (Sistema VCR Systems) para arquivos Parquet no S3 do Supabase.

## 🚀 Estrutura do Projeto

- `rs_export_to_parquet.py`: Script principal de ETL que extrai tabelas do MySQL, converte para Parquet e faz o upload para o S3 do Supabase.
- `rs_rodoviasul_etl.yml`: Configuração do fluxo (Blueprint) para execução automatizada no **Kestra**.
- `explorador_rodoviasul.py`: Ferramenta para mapeamento de estrutura de tabelas, análise de volume e identificação de campos críticos.
- `test_amostras.py`: Script rápido para validar a conexão e visualizar os primeiros 10 registros de cada tabela.

## 🛠️ Tecnologias Utilizadas

- **Python 3.10+**
- **Pandas**: Manipulação de dados e conversão para Parquet.
- **MySQL Connector**: Conexão com o banco legado.
- **Boto3**: Integração com o S3 do Supabase.
- **Kestra**: Orquestração do fluxo de dados.

## ⚙️ Configuração e Execução Local

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/rodoviasul/rodovia-sul.git
   cd rodovia-sul
   ```

2. **Crie e ative um ambiente virtual:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:
   ```env
   # Banco de Dados
   RODOVIASUL_HOST=seu_ip
   RODOVIASUL_PORT=3306
   RODOVIASUL_DB=rodoviasul
   RODOVIASUL_USER=seu_usuario
   RODOVIASUL_PASSWORD=sua_senha

   # S3 / Supabase
   SUPABASE_BUCKET=parquet
   SUPABASE_S3_ENDPOINT=https://xxxx.supabase.co/storage/v1/s3
   AWS_ACCESS_KEY_ID=sua_key
   AWS_SECRET_ACCESS_KEY=sua_secret
   AWS_DEFAULT_REGION=sa-east-1
   ```

5. **Execute o ETL:**
   ```bash
   python rs_export_to_parquet.py
   ```

## ☁️ Automação no Kestra

Para rodar no Kestra:
1. Adicione o script `rs_export_to_parquet.py` nos **Namespace Files**.
2. Crie um novo fluxo usando o conteúdo do arquivo `rs_rodoviasul_etl.yml`.
3. Configure as variáveis no **KV Store** com o prefixo `RS_` conforme especificado no YAML.

---
*Desenvolvido para Rodovia Sul - Dashboard Financeiro.*
