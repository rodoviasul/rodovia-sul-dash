import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TipoFluxo, CategoriaFluxo } from '../../hooks/useDominios';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  ChevronRight,
  GripVertical,
  Wallet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Save } from 'lucide-react';

export default function EstruturaFluxo() {
  const [tipos, setTipos] = useState<TipoFluxo[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFluxo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para Edição de Tipo
  const [tipoParaEditar, setTipoParaEditar] = useState<TipoFluxo | null>(null);
  const [editTipoNome, setEditTipoNome] = useState('');
  const [editTipoOrdem, setEditTipoOrdem] = useState<number>(0);
  const [salvandoTipoEdicao, setSalvandoTipoEdicao] = useState(false);

  // Estado para Edição de Categoria
  const [catParaEditar, setCatParaEditar] = useState<CategoriaFluxo | null>(null);
  const [editCatNome, setEditCatNome] = useState('');
  const [salvandoCatEdicao, setSalvandoCatEdicao] = useState(false);

  const [novaCatNomeParaTipoId, setNovaCatNomeParaTipoId] = useState<string | null>(null);
  const [novaCatNome, setNovaCatNome] = useState('');

  // Filtragem
  const filteredTipos = tipos.filter(tipo => {
    const tipoMatch = tipo.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const catsMatch = categorias.some(cat => 
      cat.tipo_id === tipo.id && 
      cat.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return tipoMatch || catsMatch;
  });

  const filteredCategoriasFunc = (tipoId: string) => {
    const tipo = tipos.find(t => t.id === tipoId);
    const tipoMatch = tipo?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    return categorias.filter(cat => {
      if (cat.tipo_id !== tipoId) return false;
      if (tipoMatch) return true;
      return cat.nome.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  // Carregar dados iniciais
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: t } = await supabase.from('fin_fluxo_tipos').select('*').order('ordem');
      const { data: c } = await supabase.from('fin_fluxo_categorias').select('*').order('nome');
      setTipos(t || []);
      setCategorias(c || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Ações de Tipo ---

  const abrirEdicaoTipo = (tipo: TipoFluxo) => {
    setTipoParaEditar(tipo);
    setEditTipoNome(tipo.nome);
    setEditTipoOrdem(tipo.ordem || 0);
  };

  const salvarEdicaoTipo = async () => {
    if (!tipoParaEditar) return;
    setSalvandoTipoEdicao(true);
    try {
      const { error } = await supabase
        .from('fin_fluxo_tipos')
        .update({ nome: editTipoNome, ordem: editTipoOrdem })
        .eq('id', tipoParaEditar.id);

      if (error) throw error;

      toast.success("Tipo atualizado!");
      setTipoParaEditar(null);
      fetchData();
    } catch (err) {
      toast.error("Erro ao atualizar tipo");
    } finally {
      setSalvandoTipoEdicao(false);
    }
  };

  const criarCategoria = async (tipoId: string) => {
    if (!novaCatNome.trim()) return;

    const { error } = await supabase.from('fin_fluxo_categorias').insert({
      tipo_id: tipoId,
      nome: novaCatNome
    });

    if (error) {
      toast.error("Erro ao criar categoria");
    } else {
      toast.success("Categoria criada!");
      setNovaCatNome('');
      setNovaCatNomeParaTipoId(null);
      fetchData();
    }
  };

  const abrirEdicaoCat = (cat: CategoriaFluxo) => {
    setCatParaEditar(cat);
    setEditCatNome(cat.nome);
  };

  const salvarEdicaoCat = async () => {
    if (!catParaEditar) return;
    setSalvandoCatEdicao(true);
    try {
      const { error } = await supabase
        .from('fin_fluxo_categorias')
        .update({ nome: editCatNome })
        .eq('id', catParaEditar.id);

      if (error) throw error;

      toast.success("Categoria atualizada!");
      setCatParaEditar(null);
      fetchData();
    } catch (err) {
      toast.error("Erro ao atualizar categoria");
    } finally {
      setSalvandoCatEdicao(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-10 h-10 animate-spin text-rodovia-verde mb-4" />
        <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Carregando Fluxo...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-4 pb-0 space-y-2">
      {/* Editorial Header */}
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-end gap-2 border-b border-rodovia-verde/20 pb-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-rodovia-verde" />
            <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Estruturação Financeira</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-rodovia-azul uppercase">
            Hierarquia <span className="text-rodovia-verde">Fluxo de Caixa</span>
          </h1>
          <p className="text-zinc-500 text-[11px] font-medium max-w-xl">
            Configure os tipos e categorias para o controle de movimentação financeira.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl rounded-xl border border-black/5 px-4 py-2">
           <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Tipos</span>
            <span className="text-lg font-black text-rodovia-azul">{tipos.length}</span>
          </div>
          <div className="w-px h-6 bg-zinc-200" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Categorias</span>
            <span className="text-lg font-black text-rodovia-verde">{categorias.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-shrink-0 relative group w-full">
        <Input 
          placeholder="BUSCAR POR TIPO OU CATEGORIA..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="h-10 pl-11 bg-white rounded-xl border-2 border-zinc-100 text-[9px] font-black uppercase tracking-[0.2em] focus:border-rodovia-verde focus:ring-0 transition-all shadow-sm backdrop-blur-sm"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rodovia-verde transition-colors pointer-events-none">
          <Search className="w-3.5 h-3.5" />
        </div>
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-rodovia-azul transition-colors"
          >
            <span className="text-[8px] font-black uppercase tracking-widest">Limpar</span>
          </button>
        )}
      </div>

      {/* Estrutura Unificada */}
      <div className="flex-1 min-h-0 bg-white/90 backdrop-blur-2xl rounded-xl border border-black/5 overflow-hidden flex flex-col">
        {/* Cabeçalho da Tabela */}
        <div className="grid grid-cols-12 bg-slate-900 py-3 px-6 sticky top-0 z-10 shadow-lg">
          <div className="col-span-1 text-white/50 font-mono text-[8px] font-black uppercase tracking-[0.2em]">Ref</div>
          <div className="col-span-8 text-white font-mono text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-rodovia-verde animate-pulse" />
            Estrutura de Fluxo de Caixa
          </div>
          <div className="col-span-3 text-right text-white/50 font-mono text-[8px] font-black uppercase tracking-[0.2em]">Operações</div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none pb-4">
          <div className="divide-y divide-zinc-100">
            {filteredTipos.map((tipo) => (
              <div key={tipo.id} className="transition-all duration-300">
                {/* Nível 1: Tipo */}
                <div className="grid grid-cols-12 py-2 px-6 items-center bg-zinc-50/80 hover:bg-zinc-100/80 group cursor-default backdrop-blur-sm">
                  <div className="col-span-1 flex items-center gap-3">
                    <span className="font-mono text-[10px] font-black text-rodovia-azul/40">{tipo.ordem}</span>
                  </div>
                  <div className="col-span-8 flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-rodovia-verde shadow-inner border-2 border-white" />
                    <span className="font-serif text-base font-black text-rodovia-azul uppercase tracking-tighter group-hover:text-rodovia-verde transition-colors">
                      {searchTerm ? (
                        tipo.nome.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => (
                          part.toLowerCase() === searchTerm.toLowerCase() 
                            ? <span key={i} className="bg-rodovia-verde/20 text-rodovia-verde">{part}</span>
                            : part
                        ))
                      ) : tipo.nome}
                    </span>
                  </div>
                  <div className="col-span-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 rounded-lg hover:bg-white hover:shadow-md text-[8px] font-black uppercase tracking-widest text-rodovia-verde hover:text-rodovia-verde flex gap-1.5" 
                      onClick={() => setNovaCatNomeParaTipoId(tipo.id)}
                    >
                      <Plus className="w-3 h-3" />
                      Nova Categoria
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg hover:bg-white hover:shadow-md hover:text-zinc-400" 
                      onClick={() => abrirEdicaoTipo(tipo)}
                    >
                      <Edit2 className="w-3 h-3 text-zinc-400" />
                    </Button>
                  </div>
                </div>

                {/* Input para Nova Categoria (se ativo) */}
                {novaCatNomeParaTipoId === tipo.id && (
                  <div className="grid grid-cols-12 py-2 px-6 pl-14 items-center bg-white border-y border-rodovia-verde/30 shadow-inner">
                    <div className="col-span-9 flex gap-3">
                      <div className="w-6 h-px bg-rodovia-verde/30 self-center" />
                      <Input 
                        autoFocus
                        placeholder="DEFINA O NOME DA NOVA CATEGORIA..." 
                        value={novaCatNome}
                        onChange={e => setNovaCatNome(e.target.value.toUpperCase())}
                        className="h-8 bg-zinc-50 border-2 border-zinc-100 rounded-lg text-[9px] font-black uppercase tracking-widest focus:border-rodovia-verde focus:ring-0 transition-all"
                        onKeyDown={e => {
                          if (e.key === 'Enter') criarCategoria(tipo.id);
                          if (e.key === 'Escape') setNovaCatNomeParaTipoId(null);
                        }}
                      />
                    </div>
                    <div className="col-span-3 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-[8px] font-black uppercase tracking-widest h-8 px-3" onClick={() => setNovaCatNomeParaTipoId(null)}>Descartar</Button>
                      <Button size="sm" className="bg-rodovia-verde hover:bg-rodovia-verde/90 text-white text-[8px] font-black uppercase tracking-widest h-8 px-4 rounded-lg shadow-lg shadow-rodovia-verde/20" onClick={() => criarCategoria(tipo.id)}>Confirmar</Button>
                    </div>
                  </div>
                )}

                {/* Nível 2: Categorias */}
                <div className="bg-white">
                  {filteredCategoriasFunc(tipo.id).length > 0 ? (
                    filteredCategoriasFunc(tipo.id).map((cat, cIdx) => (
                      <div 
                        key={cat.id}
                        className="grid grid-cols-12 py-1.5 px-6 pl-14 items-center border-b border-zinc-50 hover:bg-zinc-50 group transition-all hover:pl-16"
                      >
                        <div className="col-span-1">
                          <span className="font-mono text-[9px] font-bold text-zinc-300">{tipo.ordem}.{cIdx+1}</span>
                        </div>
                        <div className="col-span-8 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full border-2 border-zinc-200 group-hover:border-rodovia-verde transition-colors" />
                          <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-rodovia-azul transition-all">
                            {searchTerm ? (
                              cat.nome.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => (
                                part.toLowerCase() === searchTerm.toLowerCase() 
                                  ? <span key={i} className="bg-rodovia-verde/20 text-rodovia-verde">{part}</span>
                                  : part
                              ))
                            ) : cat.nome}
                          </span>
                        </div>
                        <div className="col-span-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-white hover:shadow-sm hover:text-zinc-400" onClick={() => abrirEdicaoCat(cat)}>
                            <Edit2 className="w-2.5 h-2.5 text-zinc-400" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-3 px-6 pl-14 bg-zinc-50/20 border-b border-zinc-50">
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Search className="w-3 h-3 opacity-30" />
                        {searchTerm ? "Nenhuma categoria encontrada" : "Aguardando configuração de categorias"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredTipos.length === 0 && (
               <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3">
                 <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center">
                   <Search className="w-6 h-6 text-zinc-200" />
                 </div>
                 <div className="space-y-1">
                   <h3 className="text-xs font-black text-rodovia-azul uppercase tracking-widest">Nenhum resultado encontrado</h3>
                   <p className="text-[10px] text-zinc-400 font-medium">Não encontramos nenhum tipo ou categoria com "{searchTerm}"</p>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setSearchTerm('')}
                   className="text-[9px] font-black uppercase tracking-widest text-rodovia-verde"
                 >
                   Limpar Busca
                 </Button>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Dialog de Edição de Tipo (Nível 1) */}
      <Dialog open={!!tipoParaEditar} onOpenChange={(open) => !open && setTipoParaEditar(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-rodovia-verde" />
              <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Configuração de Fluxo</span>
            </div>
            <DialogTitle className="text-xl font-black text-rodovia-azul uppercase tracking-tight">Editar Tipo</DialogTitle>
            <DialogDescription className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Faça alterações no tipo selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tipoNome" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Nome do Tipo
              </Label>
              <Input
                id="tipoNome"
                value={editTipoNome}
                onChange={(e) => setEditTipoNome(e.target.value.toUpperCase())}
                className="h-14 bg-zinc-50 border-2 border-zinc-200/50 rounded-2xl font-black text-sm uppercase tracking-wider focus:border-rodovia-verde focus:ring-0 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoOrdem" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Ordem de Exibição
              </Label>
              <Input
                id="tipoOrdem"
                type="number"
                value={editTipoOrdem}
                onChange={(e) => setEditTipoOrdem(parseInt(e.target.value) || 0)}
                className="h-14 bg-zinc-50 border-2 border-zinc-200/50 rounded-2xl font-black text-sm focus:border-rodovia-verde focus:ring-0 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="bg-zinc-50 p-8 mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setTipoParaEditar(null)} disabled={salvandoTipoEdicao} className="rounded-xl font-black text-[10px] uppercase tracking-widest">
              Cancelar
            </Button>
            <Button onClick={salvarEdicaoTipo} disabled={salvandoTipoEdicao} className="bg-rodovia-verde hover:bg-rodovia-verde/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-8 shadow-xl shadow-rodovia-verde/20 h-12">
              {salvandoTipoEdicao ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Categoria (Nível 2) */}
      <Dialog open={!!catParaEditar} onOpenChange={(open) => !open && setCatParaEditar(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-rodovia-verde" />
              <span className="text-[9px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Configuração de Fluxo</span>
            </div>
            <DialogTitle className="text-xl font-black text-rodovia-azul uppercase tracking-tight">Editar Categoria</DialogTitle>
            <DialogDescription className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Faça alterações na categoria selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="catNome" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Nome da Categoria
              </Label>
              <Input
                id="catNome"
                value={editCatNome}
                onChange={(e) => setEditCatNome(e.target.value.toUpperCase())}
                className="h-14 bg-zinc-50 border-2 border-zinc-200/50 rounded-2xl font-black text-sm uppercase tracking-wider focus:border-rodovia-verde focus:ring-0 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="bg-zinc-50 p-8 mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setCatParaEditar(null)} disabled={salvandoCatEdicao} className="rounded-xl font-black text-[10px] uppercase tracking-widest">
              Cancelar
            </Button>
            <Button onClick={salvarEdicaoCat} disabled={salvandoCatEdicao} className="bg-rodovia-verde hover:bg-rodovia-verde/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-8 shadow-xl shadow-rodovia-verde/20 h-12">
              {salvandoCatEdicao ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
