import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { ToastProvider } from "@/components/notifications";
import ToastContainer from "@/components/ui/ToastContainer";
import WhatsNewModal from "@/components/ui/WhatsNewModal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userInfo = {
    displayName:
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "User",
    email: user.email || "",
    avatarUrl: user.user_metadata?.avatar_url || null,
  };

  return (
    <ToastProvider userId={user.id}>
      <div className="flex h-dvh overflow-hidden safe-top">
        <Sidebar user={userInfo} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userId={user.id} />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <ToastContainer />
      <WhatsNewModal />
    </ToastProvider>
  );
}
