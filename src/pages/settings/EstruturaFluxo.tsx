import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useDominios, TipoFluxo, CategoriaFluxo } from '../../hooks/useDominios';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EstruturaFluxo() {
  const [tipos, setTipos] = useState<TipoFluxo[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFluxo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoFluxo | null>(null);
  const [novoTipoNome, setNovaTipoNome] = useState('');
  const [novaCatNome, setNovaCatNome] = useState('');

  // Carregar dados iniciais
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: t } = await supabase.from('fin_fluxo_tipos').select('*').order('ordem');
      setTipos(t || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Carregar Categorias quando seleciona Tipo
  useEffect(() => {
    if (tipoSelecionado) {
      const fetchCat = async () => {
        const { data: c } = await supabase
          .from('fin_fluxo_categorias')
          .select('*')
          .eq('tipo_id', tipoSelecionado.id)
          .order('nome');
        setCategorias(c || []);
      };
      fetchCat();
    } else {
      setCategorias([]);
    }
  }, [tipoSelecionado]);

  // --- Ações de Tipo ---

  const criarTipo = async () => {
    if (!novoTipoNome.trim()) return;
    
    const { error } = await supabase.from('fin_fluxo_tipos').insert({
      nome: novoTipoNome,
      ordem: tipos.length + 1
    });

    if (error) {
      toast.error("Erro ao criar tipo");
    } else {
      toast.success("Tipo de fluxo criado!");
      setNovaTipoNome('');
      fetchData();
    }
  };

  const deletarTipo = async (id: string) => {
    if (!confirm("Tem certeza?")) return;

    const { error } = await supabase.from('fin_fluxo_tipos').delete().eq('id', id);
    if (error) toast.error("Erro ao deletar");
    else {
      toast.success("Tipo removido");
      if (tipoSelecionado?.id === id) setTipoSelecionado(null);
      fetchData();
    }
  };

  // --- Ações de Categoria ---

  const criarCategoria = async () => {
    if (!novaCatNome.trim() || !tipoSelecionado) return;

    const { error } = await supabase.from('fin_fluxo_categorias').insert({
      tipo_id: tipoSelecionado.id,
      nome: novaCatNome
    });

    if (error) {
      toast.error("Erro ao criar categoria");
    } else {
      toast.success("Categoria criada!");
      setNovaCatNome('');
      // Refresh local
      const { data: c } = await supabase
        .from('fin_fluxo_categorias')
        .select('*')
        .eq('tipo_id', tipoSelecionado.id)
        .order('nome');
      setCategorias(c || []);
    }
  };

  const deletarCategoria = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    
    const { error } = await supabase.from('fin_fluxo_categorias').delete().eq('id', id);
    if (error) toast.error("Erro ao deletar");
    else {
      toast.success("Categoria removida");
      setCategorias(prev => prev.filter(c => c.id !== id));
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Coluna 1: Tipos */}
      <div className="w-1/3 flex flex-col bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
          <h2 className="font-bold text-zinc-700 dark:text-zinc-200">Tipos de Fluxo</h2>
          <span className="text-xs text-zinc-400">{tipos.length} itens</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tipos.map(tipo => (
            <div 
              key={tipo.id}
              onClick={() => setTipoSelecionado(tipo)}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border",
                tipoSelecionado?.id === tipo.id 
                  ? "bg-rodovia-azul/10 border-rodovia-azul text-rodovia-azul dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400" 
                  : "bg-white border-transparent hover:bg-zinc-50 dark:bg-transparent dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400">#{tipo.ordem}</span>
                <span className="font-medium">{tipo.nome}</span>
              </div>
              {tipoSelecionado?.id === tipo.id && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); deletarTipo(tipo.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex gap-2">
            <Input 
              placeholder="Novo Tipo..." 
              value={novoTipoNome}
              onChange={e => setNovaTipoNome(e.target.value)}
              className="bg-white dark:bg-zinc-900"
            />
            <Button size="icon" onClick={criarTipo} disabled={!novoTipoNome}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Coluna 2: Categorias */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-hidden">
        {tipoSelecionado ? (
          <>
            <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50">
              <h2 className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                <span className="text-zinc-400 font-normal">Categorias de:</span>
                {tipoSelecionado.nome}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {categorias.length === 0 ? (
                <div className="text-center text-zinc-400 py-10 italic">
                  Nenhuma categoria cadastrada.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {categorias.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-800/30 group hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cat.nome}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                        onClick={() => deletarCategoria(cat.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex gap-2 max-w-md">
                <Input 
                  placeholder={`Nova categoria em ${tipoSelecionado.nome}...`} 
                  value={novaCatNome}
                  onChange={e => setNovaCatNome(e.target.value)}
                  className="bg-white dark:bg-zinc-900"
                  onKeyDown={e => e.key === 'Enter' && criarCategoria()}
                />
                <Button onClick={criarCategoria} disabled={!novaCatNome}>
                  Adicionar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <GripVertical className="w-12 h-12 mb-4 opacity-20" />
            <p>Selecione um tipo ao lado para gerenciar suas categorias.</p>
          </div>
        )}
      </div>
    </div>
  );
}
