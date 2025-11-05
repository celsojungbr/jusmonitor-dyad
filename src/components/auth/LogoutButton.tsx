import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Loader2 } from "lucide-react";

/**
 * Logout Button Component
 * 
 * A reusable button component for logging out users with optional confirmation dialog.
 * 
 * @example
 * ```typescript
 * // Simple logout button
 * <LogoutButton />
 * 
 * // Customized button
 * <LogoutButton 
 *   variant="destructive" 
 *   size="lg"
 *   showConfirmDialog={true}
 * />
 * 
 * // In dropdown menu
 * <DropdownMenuItem asChild>
 *   <LogoutButton 
 *     variant="ghost" 
 *     showConfirmDialog={false}
 *   />
 * </DropdownMenuItem>
 * ```
 */
interface LogoutButtonProps {
  /** Button variant style */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional CSS classes */
  className?: string;
  /** Show logout icon */
  showIcon?: boolean;
  /** Show confirmation dialog before logout */
  showConfirmDialog?: boolean;
}

export function LogoutButton({
  variant = "ghost",
  size = "default",
  className,
  showIcon = true,
  showConfirmDialog = true,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });

      navigate("/auth");
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);

      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const LogoutButtonContent = (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
      onClick={showConfirmDialog ? undefined : handleLogout}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {size !== "icon" && <span className="ml-2">Saindo...</span>}
        </>
      ) : (
        <>
          {showIcon && <LogOut className="h-4 w-4" />}
          {size !== "icon" && <span className={showIcon ? "ml-2" : ""}>Sair</span>}
        </>
      )}
    </Button>
  );

  if (!showConfirmDialog) {
    return LogoutButtonContent;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{LogoutButtonContent}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja sair? Você precisará fazer login novamente para acessar
            sua conta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saindo...
              </>
            ) : (
              "Sair"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}