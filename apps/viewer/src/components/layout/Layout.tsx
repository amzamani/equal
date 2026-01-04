import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";

export function Layout() {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="container py-6 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
