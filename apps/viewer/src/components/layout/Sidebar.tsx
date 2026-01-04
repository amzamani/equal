import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Activity, Book, BarChart3 } from 'lucide-react';
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/docs", label: "Docs", icon: Book },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <div className="w-64 border-r bg-card h-screen flex flex-col">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-6 h-6 text-primary" />
                    X-Ray
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href ||
                        (item.href !== "/" && location.pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
