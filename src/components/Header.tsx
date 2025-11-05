import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src="https://res.cloudinary.com/dsdzoebyq/image/upload/v1762059245/JUSMONITOR_Logo_Horizontal_Black_ppc9km.png"
            alt="JusMonitor"
            className="h-8 md:h-10"
          />
        </Link>

        {/* Navigation Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Produto</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[1fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        to="/recursos"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Recursos
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Conheça todas as funcionalidades da plataforma
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/funcionalidades" title="Funcionalidades">
                    Consultas, monitoramento e automação
                  </ListItem>
                  <ListItem href="/integracao" title="Integração">
                    API e integrações com sistemas jurídicos
                  </ListItem>
                  <ListItem href="/seguranca" title="Segurança">
                    Proteção de dados e conformidade LGPD
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/precos" className={navigationMenuTriggerStyle()}>
                  Preços
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  <ListItem href="/escritorios" title="Para Escritórios">
                    Gerencie múltiplos advogados e processos
                  </ListItem>
                  <ListItem href="/advogados" title="Para Advogados">
                    Organize sua rotina profissional
                  </ListItem>
                  <ListItem href="/empresas" title="Para Empresas">
                    Monitore processos corporativos
                  </ListItem>
                  <ListItem href="/departamentos" title="Jurídico Interno">
                    Solução para departamentos jurídicos
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/sobre" className={navigationMenuTriggerStyle()}>
                  Sobre
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Criar Conta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

const ListItem = ({
  className,
  title,
  children,
  href,
  ...props
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className={cn(
            "group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent focus:bg-accent",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none group-hover:text-white">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground group-hover:text-white">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

export default Header;
