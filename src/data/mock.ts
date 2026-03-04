export const mockSummary = [
  { periodo: '2023-10', receitaBruta: 980000, resultadoLiquido: 150000, saldoCaixa: 450000, margemLiquida: 15.3, diasCobertura: 30, deltaResultadoMesAnterior: 5.2 },
  { periodo: '2023-11', receitaBruta: 1020000, resultadoLiquido: 180000, saldoCaixa: 520000, margemLiquida: 17.6, diasCobertura: 35, deltaResultadoMesAnterior: 20.0 },
  { periodo: '2023-12', receitaBruta: 1150000, resultadoLiquido: 210000, saldoCaixa: 580000, margemLiquida: 18.2, diasCobertura: 40, deltaResultadoMesAnterior: 16.6 },
  { periodo: '2024-01', receitaBruta: 1080000, resultadoLiquido: 190000, saldoCaixa: 650000, margemLiquida: 17.5, diasCobertura: 42, deltaResultadoMesAnterior: -9.5 },
  { periodo: '2024-02', receitaBruta: 1120000, resultadoLiquido: 225000, saldoCaixa: 720000, margemLiquida: 20.1, diasCobertura: 45, deltaResultadoMesAnterior: 18.4 },
  { periodo: '2024-03', receitaBruta: 1250000, resultadoLiquido: 285000, saldoCaixa: 850400, margemLiquida: 22.8, diasCobertura: 48, deltaResultadoMesAnterior: 26.6 },
];

export const mockDRE = [
  {
    periodo: '2024-03',
    linhas: [
      { codigo: '3.01', nome: 'RECEITA BRUTA OPERACIONAL', valor: 1250000, valorAnterior: 1085000, tipo: 'receita' },
      { codigo: '3.01.01', nome: 'Vendas de Serviços Logísticos', valor: 980000, valorAnterior: 820000, tipo: 'receita' },
      { codigo: '3.01.02', nome: 'Locação de Equipamentos', valor: 270000, valorAnterior: 265000, tipo: 'receita' },
      { codigo: '3.02', nome: '(-) DEDUÇÕES DA RECEITA', valor: -125000, valorAnterior: -108500, tipo: 'deducao' },
      { codigo: '3.03', nome: '(=) RECEITA LÍQUIDA', valor: 1125000, valorAnterior: 976500, tipo: 'total' },
      { codigo: '3.04', nome: '(-) CUSTOS OPERACIONAIS (CPV)', valor: -402500, valorAnterior: -385000, tipo: 'custo' },
      { codigo: 'CUSTO_COMB', nome: 'Combustíveis e Lubrificantes', valor: -185000, valorAnterior: -162000, tipo: 'custo' },
      { codigo: 'CUSTO_MANUT', nome: 'Manutenção de Frota', valor: -120000, valorAnterior: -145000, tipo: 'custo' },
      { codigo: 'CUSTO_MAO_OBRA', nome: 'Mão de Obra Direta', valor: -97500, valorAnterior: -78000, tipo: 'custo' },
      { codigo: 'EBITDA', nome: '(=) EBITDA GERENCIAL', valor: 425000, valorAnterior: 380000, tipo: 'total' },
      { codigo: '3.09', nome: '(=) LUCRO LÍQUIDO', valor: 285000, valorAnterior: 191000, tipo: 'total' },
    ]
  }
];

export const mockCashFlow = [
  { categoria: 'Saldo Inicial', valor: 720000, tipo: 'inicial' },
  { categoria: 'Recebimentos Clientes', valor: 1120000, tipo: 'entrada' },
  { categoria: 'Pagamento Fornecedores', valor: -450000, tipo: 'saida' },
  { categoria: 'Folha de Pagamento', valor: -180000, tipo: 'saida' },
  { categoria: 'Impostos e Taxas', valor: -95000, tipo: 'saida' },
  { categoria: 'Investimentos Capex', valor: -120000, tipo: 'saida' },
  { categoria: 'Saldo Final', valor: 850400, tipo: 'final' },
];
