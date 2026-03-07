import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { CategoriaDRE, SubcategoriaDRE } from '../../hooks/useDominios';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Save, 
  ChevronRight,
  ChevronDown,
  GripVertical,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  Calculator,
  Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export default function EstruturaDRE() {
  const [categorias, setCategorias] = useState<CategoriaDRE[]>([]);
  const [subcategorias, setSubcategorias] = useState<SubcategoriaDRE[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para controle de expansão (IDs das categorias expandidas)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  
  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(catId)) {
        newSet.delete(catId);
      } else {
        newSet.add(catId);
      }
      return newSet;
    });
  };

  const expandAll = () => setExpandedCats(new Set(categorias.map(c => c.id)));
  const collapseAll = () => setExpandedCats(new Set());

  // Estado para Edição de Categoria
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<CategoriaDRE | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editNomeDre, setEditNomeDre] = useState('');
  const [editOrdem, setEditOrdem] = useState<number>(0);
  const [editDescricao, setEditDescricao] = useState('');
  const [editDre, setEditDre] = useState(true);
  const [editTipo, setEditTipo] = useState<'CONTA' | 'SUBTOTAL'>('CONTA');
  const [editFormula, setEditFormula] = useState('');

  // Filtragem
  const filteredCategorias = useMemo(() => {
    return categorias.filter(cat => {
      const catMatch = cat.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (cat.nome_dre && cat.nome_dre.toLowerCase().includes(searchTerm.toLowerCase()));
      const subsMatch = subcategorias.some(sub => 
        sub.categoria_id === cat.id && 
        sub.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return catMatch || subsMatch;
    });
  }, [categorias, subcategorias, searchTerm]);

  // Auto-expansão na busca (via Effect para evitar loop no render)
  useEffect(() => {
    if (searchTerm.trim() !== '') {
      const catsToExpand = new Set<string>();
      filteredCategorias.forEach(cat => {
        if (cat.tipo !== 'SUBTOTAL') {
          catsToExpand.add(cat.id);
        }
      });
      setExpandedCats(catsToExpand);
    }
  }, [searchTerm, filteredCategorias]);

  const filteredSubcategorias = (catId: string) => {
    const cat = categorias.find(c => c.id === catId);
    const catMatch = cat?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    return subcategorias.filter(sub => {
      if (sub.categoria_id !== catId) return false;
      if (catMatch) return true;
      return sub.nome.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Estado para Edição de Subcategoria
  const [subParaEditar, setSubParaEditar] = useState<SubcategoriaDRE | null>(null);
  const [editSubNome, setEditSubNome] = useState('');
  const [editSubDescricao, setEditSubDescricao] = useState('');
  const [salvandoSubEdicao, setSalvandoSubEdicao] = useState(false);

  const [novaSubNomeParaCatId, setNovaSubNomeParaCatId] = useState<string | null>(null);
  const [novaSubNome, setNovaSubNome] = useState('');
  const [novaSubDescricao, setNovaSubDescricao] = useState('');

  // Estados para Drag and Drop
  const [draggedSub, setDraggedSub] = useState<SubcategoriaDRE | null>(null);
  const [dropTargetCat, setDropTargetCat] = useState<CategoriaDRE | null>(null);
  const [confirmDropOpen, setConfirmDropOpen] = useState(false);
  const [executandoMove, setExecutandoMove] = useState(false);

  // Carregar dados iniciais
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: cats } = await supabase.from('fin_categorias_dre').select('*').order('ordem');
      const { data: subs } = await supabase.from('fin_subcategorias_dre').select('*').order('nome');
      setCategorias(cats || []);
      setSubcategorias(subs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const abrirEdicaoCategoria = (cat: CategoriaDRE) => {
    setCategoriaParaEditar(cat);
    setEditNome(cat.nome);
    setEditNomeDre(cat.nome_dre || '');
    setEditOrdem(cat.ordem || 0);
    setEditDescricao(cat.descricao || '');
    setEditDre(cat.dre ?? true);
    setEditTipo(cat.tipo || 'CONTA');
    setEditFormula(cat.formula || '');
  };

  const salvarEdicaoCategoria = async () => {
    if (!categoriaParaEditar) return;
    setSalvandoEdicao(true);
    try {
      const { error } = await supabase
        .from('fin_categorias_dre')
        .update({ 
          nome: editNome, 
          nome_dre: editNomeDre,
          ordem: editOrdem, 
          descricao: editDescricao,
          dre: editDre,
          tipo: editTipo,
          formula: editFormula 
        })
        .eq('id', categoriaParaEditar.id);

      if (error) throw error;

      toast.success("Categoria atualizada!");
      setCategoriaParaEditar(null);
      fetchData();
    } catch (err) {
      toast.error("Erro ao atualizar categoria");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const deletarCategoria = async (id: string) => {
    const hasSubs = subcategorias.some(s => s.categoria_id === id);
    if (hasSubs) {
      toast.error("Remova as subcategorias antes de excluir o grupo.");
      return;
    }

    try {
      const { error } = await supabase.from('fin_categorias_dre').delete().eq('id', id);
      if (error) throw error;
      toast.success("Categoria removida.");
      fetchData();
    } catch (err) {
      toast.error("Erro ao remover categoria.");
    }
  };

  const criarSubcategoria = async (catId: string) => {
    if (!novaSubNome.trim()) return;

    const { error } = await supabase.from('fin_subcategorias_dre').insert({
      categoria_id: catId,
      nome: novaSubNome,
      descricao: novaSubDescricao
    });

    if (error) {
      toast.error("Erro ao criar subcategoria");
    } else {
      toast.success("Subcategoria criada!");
      setNovaSubNome('');
      setNovaSubDescricao('');
      setNovaSubNomeParaCatId(null);
      fetchData();
    }
  };

  const abrirEdicaoSub = (sub: SubcategoriaDRE) => {
    setSubParaEditar(sub);
    setEditSubNome(sub.nome);
    setEditSubDescricao(sub.descricao || '');
  };

  const salvarEdicaoSub = async () => {
    if (!subParaEditar) return;
    setSalvandoSubEdicao(true);
    try {
      const { error } = await supabase
        .from('fin_subcategorias_dre')
        .update({ nome: editSubNome, descricao: editSubDescricao })
        .eq('id', subParaEditar.id);

      if (error) throw error;

      toast.success("Subcategoria atualizada!");
      setSubParaEditar(null);
      fetchData();
    } catch (err) {
      toast.error("Erro ao atualizar subcategoria");
    } finally {
      setSalvandoSubEdicao(false);
    }
  };

  const deletarSub = async (id: string) => {
    try {
      const { error } = await supabase.from('fin_subcategorias_dre').delete().eq('id', id);
      if (error) throw error;
      toast.success("Subcategoria removida.");
      fetchData();
    } catch (err) {
      toast.error("Erro ao remover subcategoria.");
    }
  };

  const handleDragStart = (sub: SubcategoriaDRE) => {
    setDraggedSub(sub);
  };

  const handleDragOver = (e: React.DragEvent, cat: CategoriaDRE) => {
    e.preventDefault();
    if (draggedSub) {
      if (draggedSub.categoria_id === cat.id) return;
      setDropTargetCat(cat);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetCat: CategoriaDRE) => {
    e.preventDefault();
    
    if (draggedSub) {
      if (draggedSub.categoria_id === targetCat.id) {
        setDraggedSub(null);
        setDropTargetCat(null);
        return;
      }
      setDropTargetCat(targetCat);
      setConfirmDropOpen(true);
    }
  };

  const confirmarMovimentacao = async () => {
    if (!draggedSub || !dropTargetCat) return;
    setExecutandoMove(true);
    try {
      const { error } = await supabase
        .from('fin_subcategorias_dre')
        .update({ categoria_id: dropTargetCat.id })
        .eq('id', draggedSub.id);

      if (error) throw error;

      toast.success(`"${draggedSub.nome}" movida para "${dropTargetCat.nome}"!`);
      fetchData();
      setConfirmDropOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao mover subcategoria");
    } finally {
      setExecutandoMove(false);
      setDraggedSub(null);
      setDropTargetCat(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-10 h-10 animate-spin text-rodovia-verde mb-4" />
        <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Carregando DRE...</span>
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
            Hierarquia <span className="text-rodovia-verde">DRE</span>
          </h1>
          <p className="text-zinc-500 text-[11px] font-medium max-w-xl">
            Gerencie a estrutura do seu DRE reorganizando seu negócio.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl rounded-xl border border-black/5 px-4 py-2">
           <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Grupos</span>
            <span className="text-lg font-black text-rodovia-azul">{categorias.length}</span>
          </div>
          <div className="w-px h-6 bg-zinc-200" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Detalhes</span>
            <span className="text-lg font-black text-rodovia-verde">{subcategorias.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar & Actions */}
      <div className="flex-shrink-0 flex flex-col md:flex-row gap-2 w-full">
        <div className="relative group flex-1">
          <Input 
            placeholder="BUSCAR POR GRUPO OU DETALHE..." 
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
        
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={expandAll}
            className="h-10 px-4 bg-white rounded-xl border-2 border-zinc-100 text-[8px] font-black uppercase tracking-widest hover:border-rodovia-azul hover:text-white hover:bg-rodovia-azul transition-all shadow-sm"
          >
            Expandir Tudo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={collapseAll}
            className="h-10 px-4 bg-white rounded-xl border-2 border-zinc-100 text-[8px] font-black uppercase tracking-widest hover:border-rodovia-azul hover:text-white hover:bg-rodovia-azul transition-all shadow-sm"
          >
            Recolher Tudo
          </Button>
        </div>
      </div>

      {/* Estrutura Unificada Estilo Tabela DRE */}
      <div className="flex-1 min-h-0 bg-white/90 backdrop-blur-2xl rounded-2xl border border-black/5 overflow-hidden flex flex-col">
        {/* Cabeçalho da Tabela */}
        <div className="grid grid-cols-12 bg-slate-900 py-3 px-6 sticky top-0 z-10 shadow-lg">
          <div className="col-span-1 text-white/50 font-mono text-[8px] font-black uppercase tracking-[0.2em]">Ref</div>
          <div className="col-span-8 text-white font-mono text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-rodovia-verde animate-pulse" />
            Estrutura Gerencial DRE
          </div>
          <div className="col-span-3 text-right text-white/50 font-mono text-[8px] font-black uppercase tracking-[0.2em]">Operações</div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none pb-4">
          <div className="divide-y divide-zinc-200">
            {filteredCategorias.map((cat, idx) => (
              <div 
                key={cat.id}
                onDragOver={(e) => handleDragOver(e, cat)}
                onDrop={(e) => handleDrop(e, cat)}
                onDragLeave={() => setDropTargetCat(null)}
                className={cn(
                  "transition-all duration-300 border-b border-zinc-200",
                  dropTargetCat?.id === cat.id ? "bg-rodovia-verde/5 ring-4 ring-inset ring-rodovia-verde/20" : ""
                )}
              >
                <div 
                  className={cn(
                    "grid grid-cols-12 items-center group cursor-default backdrop-blur-sm transition-all duration-300 px-6",
                    cat.tipo === 'SUBTOTAL' 
                      ? "bg-rodovia-verde/90 hover:bg-rodovia-verde border-y border-rodovia-verde/30 shadow-inner py-1.5" 
                      : "bg-zinc-50/80 hover:bg-zinc-100/80 py-3"
                  )}
                >
                  <div className="col-span-1 flex items-center gap-3">
                    {cat.tipo !== 'SUBTOTAL' ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-zinc-400 hover:bg-rodovia-azul hover:text-white transition-all rounded-md shadow-sm"
                        onClick={() => toggleExpand(cat.id)}
                      >
                        {expandedCats.has(cat.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    ) : (
                      <div className="w-6 flex justify-center">
                        <Calculator className="w-3.5 h-3.5 text-white/60" />
                      </div>
                    )}
                    <span className={cn(
                      "font-mono text-[10px] font-black",
                      cat.tipo === 'SUBTOTAL' ? "text-white/40" : "text-rodovia-azul/40"
                    )}>{cat.ordem}</span>
                  </div>
                  <div 
                    className="col-span-8 flex items-center gap-4 cursor-pointer"
                    onClick={() => cat.tipo !== 'SUBTOTAL' && toggleExpand(cat.id)}
                  >
                    {cat.tipo !== 'SUBTOTAL' && (
                      <div className="w-2.5 h-2.5 rounded-full shadow-inner border-2 border-white bg-rodovia-verde" />
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "font-serif text-base font-black uppercase tracking-tighter transition-colors",
                          cat.tipo === 'SUBTOTAL' ? "text-white" : "text-rodovia-azul group-hover:text-rodovia-verde"
                        )}>
                          {searchTerm ? (
                            (cat.nome_dre || cat.nome).split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => (
                              part.toLowerCase() === searchTerm.toLowerCase() 
                                ? <span key={i} className="bg-white/20 text-white font-bold">{part}</span>
                                : part
                            ))
                          ) : (cat.nome_dre || cat.nome)}
                        </span>
                        
                        {cat.tipo === 'SUBTOTAL' && cat.formula && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-md border border-white/10">
                            <Calculator className="w-2.5 h-2.5 text-white/70" />
                            <span className="text-[9px] font-mono font-black text-white/90 uppercase tracking-widest">
                              {cat.formula}
                            </span>
                          </div>
                        )}

                        {cat.tipo !== 'SUBTOTAL' && (
                          <>
                            {cat.dre ? (
                              <Badge variant="secondary" className="text-[7px] bg-green-50 text-green-600 border-green-100 font-black h-4">
                                DRE
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[7px] bg-zinc-50 text-zinc-400 border-zinc-100 font-black h-4">
                                OFF-DRE
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      
                      {cat.descricao && (
                        <span className={cn(
                          "text-[10px] font-medium italic -mt-1",
                          cat.tipo === 'SUBTOTAL' ? "text-white/60" : "text-zinc-400"
                        )}>
                          {cat.descricao}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    {cat.tipo !== 'SUBTOTAL' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 rounded-lg hover:bg-white hover:shadow-md text-[8px] font-black uppercase tracking-widest text-rodovia-verde hover:text-rodovia-verde flex gap-1.5" 
                        onClick={() => {
                          setNovaSubNomeParaCatId(cat.id);
                          if (!expandedCats.has(cat.id)) toggleExpand(cat.id);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                        Novo Item
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg hover:bg-white hover:shadow-md hover:text-zinc-400" 
                      onClick={() => abrirEdicaoCategoria(cat)}
                    >
                      <Edit2 className="w-3 h-3 text-zinc-400" />
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {cat.tipo !== 'SUBTOTAL' && expandedCats.has(cat.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Input para Nova Subcategoria (se ativo) */}
                      {novaSubNomeParaCatId === cat.id && (
                        <div className="grid grid-cols-12 py-4 px-6 pl-14 items-start bg-white border-y border-rodovia-verde/30 shadow-inner gap-4">
                          <div className="col-span-9 space-y-3">
                            <div className="flex gap-3">
                              <div className="w-6 h-px bg-rodovia-verde/30 self-center" />
                              <Input 
                                autoFocus
                                placeholder="NOME DO NOVO ITEM..." 
                                value={novaSubNome}
                                onChange={e => setNovaSubNome(e.target.value.toUpperCase())}
                                className="h-10 bg-zinc-50 border-2 border-zinc-100 rounded-lg text-[10px] font-black uppercase tracking-widest focus:border-rodovia-verde focus:ring-0 transition-all"
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && e.ctrlKey) criarSubcategoria(cat.id);
                                  if (e.key === 'Escape') setNovaSubNomeParaCatId(null);
                                }}
                              />
                            </div>
                            <div className="flex gap-3 pl-9">
                              <Textarea 
                                placeholder="DESCREVA O QUE SERIA ESTE ITEM (OPCIONAL)..." 
                                value={novaSubDescricao}
                                onChange={e => setNovaSubDescricao(e.target.value)}
                                className="min-h-[80px] bg-zinc-50 border-2 border-zinc-100 rounded-lg text-[10px] font-medium focus:border-rodovia-verde focus:ring-0 transition-all"
                              />
                            </div>
                          </div>
                          <div className="col-span-3 flex flex-col justify-start gap-2 pt-1">
                            <Button size="sm" className="bg-rodovia-verde hover:bg-rodovia-verde/90 text-white text-[8px] font-black uppercase tracking-widest h-10 px-4 rounded-lg shadow-lg shadow-rodovia-verde/20" onClick={() => criarSubcategoria(cat.id)}>
                              <Save className="w-3 h-3 mr-2" />
                              Confirmar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-[8px] font-black uppercase tracking-widest h-10 px-3" onClick={() => {
                              setNovaSubNomeParaCatId(null);
                              setNovaSubNome('');
                              setNovaSubDescricao('');
                            }}>Descartar</Button>
                          </div>
                        </div>
                      )}

                      {/* Nível 2: Subcategorias */}
                      <div className="bg-white">
                        {filteredSubcategorias(cat.id).length > 0 ? (
                          filteredSubcategorias(cat.id).map((sub, sIdx) => (
                            <div 
                              key={sub.id}
                              draggable
                              onDragStart={() => handleDragStart(sub)}
                              className="grid grid-cols-12 py-1.5 px-6 pl-14 items-center border-b border-zinc-100 hover:bg-zinc-50 group cursor-grab active:cursor-grabbing transition-all hover:pl-16"
                            >
                              <div className="col-span-1">
                                <span className="font-mono text-[9px] font-bold text-zinc-300">{cat.ordem}.{sIdx+1}</span>
                              </div>
                              <div className="col-span-8 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full border-2 border-zinc-200 group-hover:border-rodovia-verde transition-colors" />
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-rodovia-azul transition-all">
                                    {searchTerm ? (
                                      sub.nome.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => (
                                        part.toLowerCase() === searchTerm.toLowerCase() 
                                          ? <span key={i} className="bg-rodovia-verde/20 text-rodovia-verde">{part}</span>
                                          : part
                                      ))
                                    ) : sub.nome}
                                  </span>
                                  {sub.descricao && (
                                    <span className="text-[9px] text-zinc-400 font-medium italic">
                                      {sub.descricao}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="col-span-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-white hover:shadow-sm hover:text-zinc-400" onClick={() => abrirEdicaoSub(sub)}>
                                  <Edit2 className="w-2.5 h-2.5 text-zinc-400" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-3 px-6 pl-14 bg-zinc-50/20 border-b border-zinc-50">
                            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Search className="w-3 h-3 opacity-30" />
                              {searchTerm ? "Nenhum detalhe encontrado" : "Aguardando estruturação deste grupo"}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {filteredCategorias.length === 0 && (
               <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3">
                 <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center">
                   <Search className="w-6 h-6 text-zinc-200" />
                 </div>
                 <div className="space-y-1">
                   <h3 className="text-xs font-black text-rodovia-azul uppercase tracking-widest">Nenhum resultado encontrado</h3>
                   <p className="text-[10px] text-zinc-400 font-medium">Não encontramos nenhum grupo ou detalhe com "{searchTerm}"</p>
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

      {/* Dialogs permanecem os mesmos, mas com UI ajustada se necessário */}
      {/* Dialog de Edição de Grupo (Nível 1) */}
      <Dialog open={!!categoriaParaEditar} onOpenChange={(open) => !open && setCategoriaParaEditar(null)}>
        <DialogContent className="sm:max-max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-xl font-black text-rodovia-azul uppercase tracking-tight">Editar Grupo</DialogTitle>
            <DialogDescription className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Faça alterações na categoria selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Nome do Grupo (Interno)
              </Label>
              <Input
                id="nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value.toUpperCase())}
                className="h-14 bg-zinc-50 border-2 border-zinc-200/50 rounded-2xl font-black text-sm uppercase tracking-wider focus:border-rodovia-verde focus:ring-0 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome_dre" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Nome de Exibição (DRE/Dashboard)
              </Label>
              <Input
                id="nome_dre"
                placeholder="EX: (+) RECEITA BRUTA"
                value={editNomeDre}
                onChange={(e) => setEditNomeDre(e.target.value.toUpperCase())}
                className="h-14 bg-white border-2 border-rodovia-verde/30 rounded-2xl font-black text-sm uppercase tracking-wider focus:border-rodovia-verde focus:ring-0 transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordem" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Ordem de Exibição
              </Label>
              <Input
                id="ordem"
                type="number"
                value={editOrdem}
                onChange={(e) => setEditOrdem(parseInt(e.target.value) || 0)}
                className="h-14 bg-zinc-50 border-2 border-zinc-200/50 rounded-2xl font-black text-sm focus:border-rodovia-verde focus:ring-0 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tipo de Categoria</Label>
              <Select value={editTipo} onValueChange={(val: 'CONTA' | 'SUBTOTAL') => setEditTipo(val)}>
                <SelectTrigger className="h-14 bg-zinc-50 border-2 border-zinc-200/50 rounded-2xl font-black text-sm uppercase tracking-wider focus:border-rodovia-verde focus:ring-0 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="CONTA" className="focus:bg-rodovia-verde/10 focus:text-rodovia-verde rounded-xl py-3 px-4">
                    <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest">
                      <Layers className="w-4 h-4 text-rodovia-verde" />
                      <span>GRUPO DE CONTAS (PADRÃO)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SUBTOTAL" className="focus:bg-indigo-500/10 focus:text-indigo-600 rounded-xl py-3 px-4">
                    <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest">
                      <Calculator className="w-4 h-4 text-indigo-600" />
                      <span>CÁLCULO / SUBTOTAL</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editTipo === 'SUBTOTAL' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="formula" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                  Fórmula do Subtotal
                </Label>
                <Input
                  id="formula"
                  placeholder="EX: 1 + 2 - 3"
                  value={editFormula}
                  onChange={(e) => setEditFormula(e.target.value)}
                  className="h-14 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl font-mono text-sm font-bold text-indigo-600 focus:border-indigo-500 focus:ring-0 transition-all"
                />
                <p className="text-[8px] text-zinc-400 font-medium px-1">Use os números da "Ref" e os sinais + ou -.</p>
              </div>
            )}
            
            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border-2 border-zinc-200/50">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Exibir na DRE?</Label>
                <p className="text-[9px] text-zinc-400 font-medium">Define se este grupo deve aparecer nos relatórios de resultado.</p>
              </div>
              <Switch 
                checked={editDre}
                onCheckedChange={setEditDre}
                className="data-[state=checked]:bg-rodovia-verde"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Descrição Detalhada (Opcional)
              </Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o propósito deste grupo..."
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                className="min-h-[120px] bg-zinc-50 border-2 border-zinc-200/50 rounded-2xl font-medium text-sm focus:border-rodovia-verde focus:ring-0 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="bg-zinc-50 p-8 mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setCategoriaParaEditar(null)} disabled={salvandoEdicao} className="rounded-xl font-black text-[10px] uppercase tracking-widest">
              Cancelar
            </Button>
            <Button onClick={salvarEdicaoCategoria} disabled={salvandoEdicao} className="bg-rodovia-verde hover:bg-rodovia-verde/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-8 shadow-xl shadow-rodovia-verde/20 h-12">
              {salvandoEdicao ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Detalhe (Nível 2) */}
      <Dialog open={!!subParaEditar} onOpenChange={(open) => !open && setSubParaEditar(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-xl font-black text-rodovia-azul uppercase tracking-tight">Editar Detalhe</DialogTitle>
            <DialogDescription className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Faça alterações no detalhe selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subnome" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Nome do Detalhe
              </Label>
              <Input
                id="subnome"
                value={editSubNome}
                onChange={(e) => setEditSubNome(e.target.value.toUpperCase())}
                className="h-14 bg-zinc-50 border-2 border-zinc-200/50 rounded-2xl font-black text-sm uppercase tracking-wider focus:border-rodovia-verde focus:ring-0 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdescricao" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Descrição Detalhada (Opcional)
              </Label>
              <Textarea
                id="subdescricao"
                placeholder="Descreva o propósito deste item..."
                value={editSubDescricao}
                onChange={(e) => setEditSubDescricao(e.target.value)}
                className="min-h-[120px] bg-zinc-50 border-2 border-zinc-200/50 rounded-2xl font-medium text-sm focus:border-rodovia-verde focus:ring-0 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="bg-zinc-50 p-8 mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setSubParaEditar(null)} disabled={salvandoSubEdicao} className="rounded-xl font-black text-[10px] uppercase tracking-widest">
              Cancelar
            </Button>
            <Button onClick={salvarEdicaoSub} disabled={salvandoSubEdicao} className="bg-rodovia-verde hover:bg-rodovia-verde/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-8 shadow-xl shadow-rodovia-verde/20 h-12">
              {salvandoSubEdicao ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de Confirmação de Movimentação (Drag and Drop) */}
      <AlertDialog open={confirmDropOpen} onOpenChange={setConfirmDropOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-rodovia-azul uppercase tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              Confirmar Reestruturação
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-zinc-500 leading-relaxed py-4">
              Você está movendo o detalhe <span className="font-black text-rodovia-azul underline">"{draggedSub?.nome}"</span> para o grupo <span className="font-black text-rodovia-azul underline">"{dropTargetCat?.nome}"</span>.
              <br /><br />
              <strong className="text-rodovia-azul block mb-1 uppercase text-[11px] tracking-widest">Atenção:</strong>
              Todos os lançamentos financeiros vinculados a este detalhe serão automaticamente reclassificados para este novo grupo na sua DRE Gerencial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={executandoMove} className="rounded-xl font-black text-[10px] uppercase tracking-widest">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); confirmarMovimentacao(); }}
              disabled={executandoMove}
              className="bg-rodovia-verde hover:bg-rodovia-verde/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-8 shadow-xl shadow-rodovia-verde/20 h-12"
            >
              {executandoMove ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Confirmar Reestruturação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
