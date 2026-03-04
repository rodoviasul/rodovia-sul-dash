import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useDominios, CategoriaDRE, SubcategoriaDRE } from '../../hooks/useDominios';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  ChevronRight,
  GripVertical,
  AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

export default function EstruturaDRE() {
  const [categorias, setCategorias] = useState<CategoriaDRE[]>([]);
  const [subcategorias, setSubcategorias] = useState<SubcategoriaDRE[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaDRE | null>(null);
  
  // Estado para Edição de Categoria
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<CategoriaDRE | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editOrdem, setEditOrdem] = useState<number>(0);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [novaSubNome, setNovaSubNome] = useState('');

  // Estado para Confirmação de Exclusão
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'categoria' | 'subcategoria', id: string, nome: string } | null>(null);
  const [deletando, setDeletando] = useState(false);

  // Carregar dados iniciais
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: cats } = await supabase.from('fin_categorias_dre').select('*').order('ordem');
      setCategorias(cats || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Carregar Subcategorias quando seleciona Categoria
  useEffect(() => {
    if (categoriaSelecionada) {
      const fetchSub = async () => {
        const { data: subs } = await supabase
          .from('fin_subcategorias_dre')
          .select('*')
          .eq('categoria_id', categoriaSelecionada.id)
          .order('nome');
        setSubcategorias(subs || []);
      };
      fetchSub();
    } else {
      setSubcategorias([]);
    }
  }, [categoriaSelecionada]);

  // --- Helpers de Verificação ---
  const verificarDependencias = async (id: string, type: 'categoria' | 'subcategoria'): Promise<string | null> => {
    if (type === 'categoria') {
      // Verificar se tem subcategorias
      const { count: subCount } = await supabase
        .from('fin_subcategorias_dre')
        .select('*', { count: 'exact', head: true })
        .eq('categoria_id', id);
      
      if (subCount && subCount > 0) {
        return `Esta categoria possui ${subCount} subcategorias vinculadas.`;
      }

      // Verificar se tem contas vinculadas diretamente (caso exista essa possibilidade no sistema)
      const { count: contasCount } = await supabase
        .from('config_contas_gerencial')
        .select('*', { count: 'exact', head: true })
        .eq('dre_categoria_id', id);

      if (contasCount && contasCount > 0) {
        return `Esta categoria possui ${contasCount} contas vinculadas.`;
      }
    } else {
      // Subcategoria: verificar contas vinculadas
      const { count: contasCount } = await supabase
        .from('config_contas_gerencial')
        .select('*', { count: 'exact', head: true })
        .eq('dre_subcategoria_id', id);

      if (contasCount && contasCount > 0) {
        return `Esta subcategoria possui ${contasCount} contas vinculadas.`;
      }
    }
    return null;
  };

  // --- Ações de Categoria ---

  const criarCategoria = async () => {
    if (!novaCategoriaNome.trim()) return;
    
    const { error } = await supabase.from('fin_categorias_dre').insert({
      nome: novaCategoriaNome,
      ordem: categorias.length + 1
    });

    if (error) {
      toast.error("Erro ao criar categoria");
    } else {
      toast.success("Categoria criada!");
      setNovaCategoriaNome('');
      fetchData();
    }
  };

  const solicitarExclusaoCategoria = async (cat: CategoriaDRE) => {
    const erro = await verificarDependencias(cat.id, 'categoria');
    if (erro) {
      toast.error("Não é possível excluir", { description: erro });
      return;
    }
    setDeleteTarget({ type: 'categoria', id: cat.id, nome: cat.nome });
  };

  const abrirEdicaoCategoria = (cat: CategoriaDRE) => {
    setCategoriaParaEditar(cat);
    setEditNome(cat.nome);
    setEditOrdem(cat.ordem || 0);
  };

  const salvarEdicaoCategoria = async () => {
    if (!categoriaParaEditar) return;
    setSalvandoEdicao(true);
    try {
      const { error } = await supabase
        .from('fin_categorias_dre')
        .update({ nome: editNome, ordem: editOrdem })
        .eq('id', categoriaParaEditar.id);

      if (error) throw error;

      toast.success("Categoria atualizada!");
      setCategoriaParaEditar(null);
      fetchData();
      
      // Atualizar seleção se for a mesma
      if (categoriaSelecionada?.id === categoriaParaEditar.id) {
        setCategoriaSelecionada(prev => prev ? { ...prev, nome: editNome, ordem: editOrdem } : null);
      }
    } catch (err) {
      toast.error("Erro ao atualizar categoria");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // --- Ações de Subcategoria ---

  const criarSubcategoria = async () => {
    if (!novaSubNome.trim() || !categoriaSelecionada) return;

    const { error } = await supabase.from('fin_subcategorias_dre').insert({
      categoria_id: categoriaSelecionada.id,
      nome: novaSubNome
    });

    if (error) {
      toast.error("Erro ao criar subcategoria");
    } else {
      toast.success("Subcategoria criada!");
      setNovaSubNome('');
      // Refresh local das subs
      const { data: subs } = await supabase
        .from('fin_subcategorias_dre')
        .select('*')
        .eq('categoria_id', categoriaSelecionada.id)
        .order('nome');
      setSubcategorias(subs || []);
    }
  };

  const solicitarExclusaoSubcategoria = async (sub: SubcategoriaDRE) => {
    const erro = await verificarDependencias(sub.id, 'subcategoria');
    if (erro) {
      toast.error("Não é possível excluir", { description: erro });
      return;
    }
    setDeleteTarget({ type: 'subcategoria', id: sub.id, nome: sub.nome });
  };

  const confirmarExclusao = async () => {
    if (!deleteTarget) return;
    setDeletando(true);
    try {
      if (deleteTarget.type === 'categoria') {
        const { error } = await supabase.from('fin_categorias_dre').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        toast.success("Categoria removida");
        if (categoriaSelecionada?.id === deleteTarget.id) setCategoriaSelecionada(null);
        fetchData();
      } else {
        const { error } = await supabase.from('fin_subcategorias_dre').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        toast.success("Subcategoria removida");
        setSubcategorias(prev => prev.filter(s => s.id !== deleteTarget.id));
      }
    } catch (err) {
      toast.error("Erro ao excluir");
    } finally {
      setDeletando(false);
      setDeleteTarget(null);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Coluna 1: Categorias */}
      <div className="w-1/3 flex flex-col bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
          <h2 className="font-bold text-zinc-700 dark:text-zinc-200">Categorias (Nível 1)</h2>
          <span className="text-xs text-zinc-400">{categorias.length} itens</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categorias.map(cat => (
            <div 
              key={cat.id}
              onClick={() => setCategoriaSelecionada(cat)}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border",
                categoriaSelecionada?.id === cat.id 
                  ? "bg-rodovia-azul/10 border-rodovia-azul text-rodovia-azul dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400" 
                  : "bg-white border-transparent hover:bg-zinc-50 dark:bg-transparent dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400 w-6 text-center">#{cat.ordem}</span>
                <span className="font-medium truncate">{cat.nome}</span>
              </div>
              {categoriaSelecionada?.id === cat.id && (
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-zinc-400 hover:text-zinc-600" 
                    onClick={(e) => { e.stopPropagation(); abrirEdicaoCategoria(cat); }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50" 
                    onClick={(e) => { e.stopPropagation(); solicitarExclusaoCategoria(cat); }}
                  >
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
              placeholder="Nova Categoria..." 
              value={novaCategoriaNome}
              onChange={e => setNovaCategoriaNome(e.target.value)}
              className="bg-white dark:bg-zinc-900"
            />
            <Button size="icon" onClick={criarCategoria} disabled={!novaCategoriaNome}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Coluna 2: Subcategorias */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-hidden">
        {categoriaSelecionada ? (
          <>
            <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50">
              <h2 className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                <span className="text-zinc-400 font-normal">Detalhes de:</span>
                {categoriaSelecionada.nome}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {subcategorias.length === 0 ? (
                <div className="text-center text-zinc-400 py-10 italic">
                  Nenhuma subcategoria cadastrada.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {subcategorias.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-800/30 group hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{sub.nome}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                        onClick={() => solicitarExclusaoSubcategoria(sub)}
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
                  placeholder={`Adicionar detalhe em ${categoriaSelecionada.nome}...`} 
                  value={novaSubNome}
                  onChange={e => setNovaSubNome(e.target.value)}
                  className="bg-white dark:bg-zinc-900"
                  onKeyDown={e => e.key === 'Enter' && criarSubcategoria()}
                />
                <Button onClick={criarSubcategoria} disabled={!novaSubNome}>
                  Adicionar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <GripVertical className="w-12 h-12 mb-4 opacity-20" />
            <p>Selecione uma categoria ao lado para gerenciar seus detalhes.</p>
          </div>
        )}
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{deleteTarget?.nome}</strong>.
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarExclusao} 
              disabled={deletando}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sim, Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição de Categoria */}
      <Dialog open={!!categoriaParaEditar} onOpenChange={(open) => !open && setCategoriaParaEditar(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Faça alterações na categoria selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ordem" className="text-right">
                Ordem
              </Label>
              <Input
                id="ordem"
                type="number"
                value={editOrdem}
                onChange={(e) => setEditOrdem(parseInt(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriaParaEditar(null)} disabled={salvandoEdicao}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicaoCategoria} disabled={salvandoEdicao}>
              {salvandoEdicao ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
