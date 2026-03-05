import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let message = error.message;
        if (message === "Invalid login credentials") {
          message = "E-mail ou senha incorretos. Verifique suas credenciais.";
        } else if (message === "Email not confirmed") {
          message = "Seu e-mail ainda não foi confirmado.";
        } else if (message.includes("rate limit")) {
          message = "Muitas tentativas. Tente novamente mais tarde.";
        }
        
        toast.error("Erro ao entrar", {
          description: message,
        });
      } else {
        toast.success("Bem-vindo de volta!", {
          description: "Login realizado com sucesso.",
        });
        navigate("/");
      }
    } catch (err) {
      toast.error("Ocorreu um erro inesperado");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background Video with 50% opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-70 grayscale"
        >
          <source src="https://wnombkybmahknwcyzfqz.supabase.co/storage/v1/object/public/utils/fundo.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay to ensure cozy feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-rodovia-azul/40 via-transparent to-rodovia-verde/20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[420px] px-6 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-24 h-24 mb-6 flex items-center justify-center rounded-3xl bg-white shadow-2xl p-4 border border-white/20 backdrop-blur-md"
          >
            <img src="https://wnombkybmahknwcyzfqz.supabase.co/storage/v1/object/public/utils/logo-rodovia.png" alt="Rodovia Sul Logo" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">RODOVIA SUL</h1>
          <p className="text-white/80 mt-2 text-xs font-bold uppercase tracking-[0.3em]">Dashboard de Gestão</p>
        </div>

        <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] bg-white/95 backdrop-blur-2xl overflow-hidden rounded-[2.5rem]">
          <CardHeader className="pt-10 pb-6 text-center">
            <CardTitle className="text-2xl font-black text-rodovia-azul tracking-tight">Bem-vindo</CardTitle>
            <CardDescription className="text-rodovia-azul/70 font-medium">
              Acesse sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-rodovia-azul/80 ml-1">
                  E-mail de acesso
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rodovia-azul/40 group-focus-within:text-rodovia-verde transition-colors">
                    <Mail size={18} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 bg-rodovia-cinza/20 border-2 border-transparent focus:border-rodovia-verde/30 focus:bg-white text-rodovia-azul font-semibold placeholder:text-rodovia-azul/30 transition-all rounded-2xl shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-rodovia-azul/80 ml-1">
                  Senha pessoal
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rodovia-azul/40 group-focus-within:text-rodovia-verde transition-colors">
                    <Lock size={18} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 bg-rodovia-cinza/20 border-2 border-transparent focus:border-rodovia-verde/30 focus:bg-white text-rodovia-azul font-semibold placeholder:text-rodovia-azul/30 transition-all rounded-2xl shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-rodovia-azul/40 hover:text-rodovia-azul transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-rodovia-verde hover:bg-rodovia-verde/90 text-white font-black text-sm uppercase tracking-[0.1em] rounded-2xl shadow-xl shadow-rodovia-verde/20 transition-all active:scale-[0.98] group relative overflow-hidden mt-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    Acessar Dashboard
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pb-10 pt-4 flex justify-center border-t border-rodovia-cinza/10 mt-6">
            <p className="text-[10px] font-bold text-rodovia-azul/50 uppercase tracking-widest">
              Restrito a usuários autorizados
            </p>
          </CardFooter>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-10 text-center text-[10px] text-white/40 font-black uppercase tracking-[0.4em]"
        >
          © {new Date().getFullYear()} Rodovia Sul Group
        </motion.p>
      </motion.div>
    </div>
  );
}
