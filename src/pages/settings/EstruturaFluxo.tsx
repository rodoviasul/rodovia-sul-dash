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
  
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoFluxo | null>(null);
  
  // Estado para Edição de Tipo
  const [tipoParaEditar, setTipoParaEditar] = useState<TipoFluxo | null>(null);
  const [editTipoNome, setEditTipoNome] = useState('');
  const [editTipoOrdem, setEditTipoOrdem] = useState<number>(0);
  const [salvandoTipoEdicao, setSalvandoTipoEdicao] = useState(false);

  // Estado para Edição de Categoria
  const [catParaEditar, setCatParaEditar] = useState<CategoriaFluxo | null>(null);
  const [editCatNome, setEditCatNome] = useState('');
  const [salvandoCatEdicao, setSalvandoCatEdicao] = useState(false);

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
  const fetchCatData = async () => {
    if (!tipoSelecionado) return;
    const { data: c } = await supabase
      .from('fin_fluxo_categorias')
      .select('*')
      .eq('tipo_id', tipoSelecionado.id)
      .order('nome');
    setCategorias(c || []);
  };

  useEffect(() => {
    if (tipoSelecionado) {
      fetchCatData();
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
      
      if (tipoSelecionado?.id === tipoParaEditar.id) {
        setTipoSelecionado(prev => prev ? { ...prev, nome: editTipoNome, ordem: editTipoOrdem } : null);
      }
    } catch (err) {
      toast.error("Erro ao atualizar tipo");
    } finally {
      setSalvandoTipoEdicao(false);
    }
  };

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
      fetchCatData();
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
      fetchCatData();
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
    <div className="flex flex-col h-full px-12 pb-8 space-y-8">
      {/* Editorial Header - Fixed Area */}
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-rodovia-verde/20 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-rodovia-verde" />
            <span className="text-[10px] font-mono font-black text-rodovia-verde uppercase tracking-[0.4em]">Estruturação Financeira</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-rodovia-azul uppercase">
            Hierarquia <span className="text-rodovia-verde">Fluxo de Caixa</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium max-w-xl">
            Configure os tipos e categorias para o controle de movimentação financeira.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl rounded-2xl border border-black/5 px-6 py-4">
           <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Tipos</span>
            <span className="text-xl font-black text-rodovia-azul">{tipos.length}</span>
          </div>
          <div className="w-px h-8 bg-zinc-200" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-rodovia-verde" />
              <span className="text-[10px] font-black text-rodovia-verde uppercase">Ativo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Coluna 1: Tipos */}
        <div className="lg:col-span-5 flex flex-col bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-black/5 overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b border-black/5 flex justify-between items-center bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rodovia-verde/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-rodovia-verde" />
              </div>
              <h2 className="font-black text-rodovia-azul text-[11px] uppercase tracking-widest">Nível 1: Tipos</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
            <AnimatePresence mode="popLayout">
              {tipos.map(tipo => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={tipo.id}
                  onClick={() => setTipoSelecionado(tipo)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border-2 relative overflow-hidden group",
                    tipoSelecionado?.id === tipo.id 
                      ? "bg-rodovia-verde text-white border-rodovia-verde shadow-lg shadow-rodovia-verde/20" 
                      : "bg-white border-zinc-200 hover:border-rodovia-verde/50 text-zinc-700 shadow-sm hover:shadow-md"
                  )}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <span className={cn(
                      "text-[9px] font-black w-6 h-6 rounded-md flex items-center justify-center border",
                      tipoSelecionado?.id === tipo.id ? "bg-white/20 border-white/20 text-white" : "bg-zinc-100 border-black/5 text-zinc-400"
                    )}>
                      {tipo.ordem}
                    </span>
                    <span className="font-black text-xs tracking-tight uppercase">{tipo.nome}</span>
                  </div>

                  <div className="flex items-center gap-1 relative z-10">
                    <AnimatePresence>
                      {tipoSelecionado?.id === tipo.id && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-1"
                        >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-white hover:bg-white/20 rounded-full" 
                            onClick={(e) => { e.stopPropagation(); abrirEdicaoTipo(tipo); }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Aesthetic Inner Glow */}
                  {tipoSelecionado?.id === tipo.id && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex-shrink-0 p-4 border-t border-black/5 bg-zinc-50">
            <div className="flex gap-2">
              <Input 
                placeholder="ADICIONAR NOVO TIPO..." 
                value={novoTipoNome}
                onChange={e => setNovaTipoNome(e.target.value.toUpperCase())}
                className="bg-white h-10 rounded-xl border-2 border-zinc-200 shadow-md text-[9px] font-black tracking-widest text-rodovia-azul focus:border-rodovia-verde transition-all"
                onKeyDown={e => e.key === 'Enter' && criarTipo()}
              />
              <Button 
                size="icon" 
                onClick={criarTipo} 
                disabled={!novoTipoNome}
                className="h-10 w-10 rounded-xl bg-rodovia-verde hover:bg-rodovia-verde/90 shadow-lg shadow-rodovia-verde/20 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        </div>

        {/* Coluna 2: Categorias */}
        <div className="lg:col-span-7 flex flex-col bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-black/5 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {tipoSelecionado ? (
              <motion.div 
                key={tipoSelecionado.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col h-full"
              >
                <div className="flex-shrink-0 p-4 border-b border-black/5 bg-zinc-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rodovia-verde/10 flex items-center justify-center">
                      <Search className="w-4 h-4 text-rodovia-verde" />
                    </div>
                    <div>
                      <h2 className="font-black text-rodovia-azul text-[11px] uppercase tracking-widest">Nível 2: Categorias</h2>
                      <p className="text-[9px] font-bold text-rodovia-verde uppercase tracking-wider mt-0.5">{tipoSelecionado.nome}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {categorias.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-6">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-2">
                         <AlertTriangle className="w-6 h-6 opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center max-w-[200px]">Nenhuma categoria configurada para este tipo</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categorias.map(cat => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={cat.id} 
                          className="flex items-center justify-between p-2.5 rounded-xl border-2 border-zinc-200 bg-white group hover:border-rodovia-verde transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-rodovia-verde group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black text-rodovia-azul uppercase tracking-widest group-hover:text-rodovia-verde transition-colors">{cat.nome}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-400 hover:text-rodovia-verde hover:bg-rodovia-verde/10 rounded-full transition-all"
                            onClick={() => abrirEdicaoCat(cat)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 p-4 border-t border-black/5 bg-zinc-50">
                  <div className="flex gap-2 max-w-lg mx-auto">
                    <Input 
                      placeholder={`ADICIONAR CATEGORIA EM ${tipoSelecionado.nome}...`} 
                      value={novaCatNome}
                      onChange={e => setNovaCatNome(e.target.value.toUpperCase())}
                      className="bg-white h-10 rounded-xl border-2 border-zinc-200 shadow-md text-[9px] font-black tracking-widest text-rodovia-azul focus:border-rodovia-verde transition-all"
                      onKeyDown={e => e.key === 'Enter' && criarCategoria()}
                    />
                    <Button 
                      onClick={criarCategoria} 
                      disabled={!novaCatNome}
                      className="h-10 px-6 rounded-xl bg-rodovia-azul hover:bg-rodovia-azul/90 text-white font-black text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                      ADICIONAR
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-12"
              >
                <div className="relative mb-8">
                   <div className="absolute inset-0 bg-rodovia-verde/20 blur-[50px] rounded-full" />
                   <GripVertical className="w-20 h-20 relative z-10 opacity-20 animate-pulse" />
                </div>
                <h3 className="text-sm font-black text-rodovia-azul uppercase tracking-[0.3em] mb-2 text-center">Selecione um Tipo</h3>
                <p className="text-xs font-medium text-zinc-500 text-center max-w-xs leading-relaxed uppercase tracking-widest opacity-60">
                  Gerencie as categorias específicas de cada tipo de fluxo de caixa ao selecionar um item na lista lateral.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dialog de Edição de Tipo (Nível 1) */}
      <Dialog open={!!tipoParaEditar} onOpenChange={(open) => !open && setTipoParaEditar(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
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
                className="h-14 bg-zinc-50 border-none rounded-2xl font-black text-sm uppercase tracking-wider"
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
                className="h-14 bg-zinc-50 border-none rounded-2xl font-black text-sm"
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
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
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
                className="h-14 bg-zinc-50 border-none rounded-2xl font-black text-sm uppercase tracking-wider"
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
