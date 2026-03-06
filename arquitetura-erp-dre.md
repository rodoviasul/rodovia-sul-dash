# Arquitetura de Dados — ERP VCR Systems para DRE Gerencial

## Visão Geral

Solução de extração, transformação e análise financeira de um ERP regional (VCR Systems) com MySQL 4.1, culminando em uma DRE Gerencial customizada acessada via interface própria.

---

## Problema

O ERP VCR Systems apresenta as seguintes limitações:

- Banco de dados **MySQL 4.1** — versão antiga, difícil de conectar com ferramentas modernas
- Tabela de plano de contas (`tabcontas`) **sem estrutura hierárquica** adequada para montar uma DRE gerencial
- Sem API nativa para consumo externo dos dados

---

## Arquitetura da Solução

```
┌─────────────────┐
│  ERP VCR Systems │
│  MySQL 4.1       │
└────────┬────────┘
         │ Conexão via Python
         ▼
┌─────────────────────────────────┐
│  Script Python (GitHub)          │
│  - Conecta no MySQL 4.1          │
│  - Lê as tabelas do ERP          │
│  - Transforma em Parquet         │
│  - Salva no S3 (Supabase)        │
└────────┬────────────────────────┘
         │ Orquestrado pelo Kestra
         ▼
┌─────────────────────────────────┐
│  Kestra (Orquestrador)           │
│  - Aponta para o repositório     │
│    GitHub                        │
│  - Puxa e executa o script       │
│    Python automaticamente        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  S3 Supabase                     │
│  - Armazena os arquivos Parquet  │
│  - tabmovimento.parquet          │
│  - tabdespesas.parquet           │
│  - tabcontas.parquet             │
│  - tabbancos.parquet             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  FastAPI + DuckDB (GitHub)       │
│  - Lê os Parquet do S3           │
│  - Expõe endpoints de consulta   │
│  - Executa queries SQL via       │
│    DuckDB                        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Interface (Frontend)            │
│  - Consome a FastAPI             │
│  - Tabelas auxiliares no         │
│    Supabase para estrutura       │
│    da DRE                        │
│  - Map em memória:               │
│    concod → nível DRE            │
│  - Exibe DRE Gerencial e DFC     │
└─────────────────────────────────┘
```

---

## Componentes Detalhados

### 1. Extração — Script Python (GitHub)

- Conecta no MySQL 4.1 do ERP
- Lê as principais tabelas financeiras:
  - `tabmovimento` — lançamentos de caixa
  - `tabdespesas` — despesas vinculadas aos lançamentos
  - `tabcontas` — plano de contas do ERP
  - `tabbancos` — cadastro de bancos/contas
- Transforma os dados em formato **Parquet**
- Persiste os arquivos no **S3 do Supabase**

### 2. Orquestração — Kestra

- Monitora o repositório GitHub (GitOps)
- Puxa e executa o script Python automaticamente
- Execução **manual** durante fase de desenvolvimento
- Planejado: agendamento automático em produção

### 3. Armazenamento — S3 Supabase + Parquet

- Arquivos Parquet são leves e performáticos
- DuckDB consome Parquet nativamente com alta performance
- Supabase também armazena as **tabelas auxiliares** da DRE

### 4. API — FastAPI + DuckDB

- Roda no mesmo repositório GitHub do script de extração
- DuckDB lê os Parquet direto do S3
- Expõe os dados financeiros via endpoints REST
- Query principal dos lançamentos agrupados por conta e mês:

```sql
select
    c.concod,
    cast(date_trunc('month', m.movdatacxa) as date) as movdatacxa,
    round(sum(d.desvalor), 2) as valor
from tabmovimento as m
inner join tabdespesas as d on m.movlanc = d.deslan
left join tabcontas as c on d.desconta = c.concod
inner join tabbancos as b on m.movbanco = b.codigo
where 1=1
and m.movdatacxa between '2026-01-01' and '2026-01-31'
and m.movtipolan = 'S'
and b.banlistager = 'S'
and c.contip <> 'T'
group by c.concod, date_trunc('month', m.movdatacxa)
```

### 5. DRE Gerencial — Interface + Tabelas Auxiliares

- A `tabcontas` do ERP não possui hierarquia para DRE gerencial
- Solução: tabela auxiliar no **Supabase** mapeando `concod` para os níveis da DRE (ex: Receita Bruta, Deduções, CMV, Despesas Operacionais, etc.)
- O frontend carrega essa tabela auxiliar e faz o **map em memória** (`concod` → nível DRE)
- Agrupa e totaliza os valores por nível para exibir a DRE e DFC

---

## Fluxo de Dados Resumido

```
MySQL 4.1 → Python → Parquet → S3 Supabase → DuckDB → FastAPI → Frontend → DRE
```

---

## Status Atual

| Componente         | Status              |
|--------------------|---------------------|
| Extração Python    | ✅ Funcionando       |
| Kestra             | ✅ Funcionando (manual) |
| S3 Parquet         | ✅ Funcionando       |
| FastAPI + DuckDB   | ✅ Funcionando       |
| Tabelas auxiliares | 🔄 Em desenvolvimento |
| DRE Gerencial      | 🔄 Em desenvolvimento |
| Agendamento auto   | ⏳ Planejado         |

---

## Próximos Passos

1. Finalizar estrutura das tabelas auxiliares no Supabase (níveis da DRE/DFC)
2. Implementar o map `concod` → nível DRE no frontend
3. Montar a visão final da DRE Gerencial e DFC
4. Configurar agendamento automático no Kestra para produção
