import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  LayoutDashboard,
  Settings,
  UsersRound,
  UserRoundCog,
  CalendarCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/authentication/useAuth";
import { StudentSearchModal } from "../clearing-officer/StudentSearchModal";
import { useCallback, useState } from "react";

const navbar = [
  {
    to: "/admin-side",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    to: "/admin-side/addStudents",
    icon: UsersRound,
    label: "Student",
  },
  {
    to: "/admin-side/addClearingOfficer",
    icon: UserRoundCog,
    label: "Clearing Officer",
  },
  {
    to: "/admin-side/adminClearance",
    icon: CalendarCog,
    label: "Setup Clearance",
  },
  {
    to: "/admin-side/adminSettings",
    icon: Settings,
    label: "Account Settings",
  },
];

interface CloseSidebarProps {
  closeSidebar: () => void;
}

export function AdminSideMenu({ closeSidebar }: CloseSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  // Search modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const { user } = useAuth();

  const userName = `${user?.firstName} ${user?.lastName}`;

  const isActive = (path: string) => {
    if (path === "/admin-side" && currentPath === "/admin-side") return true;
    if (path !== "/admin-side" && currentPath.startsWith(path)) return true;
    return false;
  };

  // Handle search input click/focus - open modal
  const handleSearchClick = useCallback(() => {
    setIsSearchModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback((open: boolean) => {
    setIsSearchModalOpen(open);
  }, []);

  return (
    <aside
      className={cn(
        "h-screen  bg-[#00171f] transition-all duration-300 ease-in-out flex flex-col"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4  border-gray-200">
        <div className="flex items-center gap-2 animate-fade-in">
          <img
            className="h-12 w-12 rounded-md object-cover"
            src="/MICRO FLUX LOGO.png"
            alt="Menu icon"
          />
          <span className="font-semibold text-white">ASCS</span>
        </div>

        <button
          onClick={closeSidebar}
          className={cn(
            "lg:hidden h-8 w-8 items-center justify-center rounded-md",
            "bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-700",
            "transition-all duration-300 hover:scale-110 active:scale-95"
          )}
        >
          <ChevronLeft className="h-4 w-4 inline-block" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            readOnly
            onClick={handleSearchClick}
            onFocus={handleSearchClick}
            className="w-full rounded-lg bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
          />
        </div>
      </div>

      {/* Student Search Modal */}
      <StudentSearchModal
        open={isSearchModalOpen}
        onOpenChange={handleModalClose}
      />
      {/* Navigation */}
      <div className="mt-6 px-2 flex-1 overflow-y-auto">
        <h4 className="text-xs font-semibold text-gray-200 uppercase mb-2">
          Navigation
        </h4>

        <nav className="space-y-1">
          {navbar.map((item, index) => {
            const active = isActive(item.to);
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 group cursor-pointer",
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-200 hover:bg-gray-800 hover:text-white"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 opacity-90 rounded-lg z-0" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 z-10 relative",
                    active && "animate-pulse-glow"
                  )}
                />

                <span className="z-10 relative animate-fade-in flex-1">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-3 py-4">
        {/* Upgrade Button */}
        <Link to="/admin-side/adminSettings">
          <div className={cn("mt-auto rounded-lg hover:bg-gray-800")}>
            <div className="rounded-lg  p-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <img
                  alt=""
                  src={
                    user?.profileImage ||
                    "https://media.istockphoto.com/id/1327592449/vector/default-avatar-photo-placeholder-icon-grey-profile-picture-business-man.jpg?s=612x612&w=0&k=20&c=yqoos7g9jmufJhfkbQsk-mdhKEsih6Di4WZ66t_ib7I="
                  }
                  className="size-10 rounded-full object-cover border-2 border-blue-500"
                />
                <div>
                  <p className="font-medium text-xs text-blue-600">
                    {userName}
                  </p>
                  {/* <p className="text-xs text-gray-400">{user?.email}</p> */}
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
