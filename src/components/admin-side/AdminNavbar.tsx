// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { Bell, LogOut, Menu } from "lucide-react";
// import { ScanOutlined } from "@ant-design/icons";
// import { useState } from "react";
// import NotificationDrawer from "../NotificationDrawer";
// import { useAuth } from "@/authentication/useAuth";

// interface NavbarProps {
//   toggleSidebar: () => void;
// }

// export default function AdminNavbar({ toggleSidebar }: NavbarProps) {
//   const location = useLocation();
//   const [isNotificationOpen, setIsNotificationOpen] = useState(false);
//   const navigate = useNavigate();
//   const { logout } = useAuth();

//   const handleLogout = async () => {
//     try {
//       await logout();
//       navigate("/login");
//     } catch {
//       // Optionally handle error (e.g., show notification)
//       navigate("/login");
//     }
//   };

//   return (
//     <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-lg">
//       <div className="mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16 items-center">
//           {/* Left Side: Logo and Navigation */}
//           <div className="flex items-center">
//             <button
//               onClick={toggleSidebar}
//               className="lg:hidden p-2 rounded-md hover:bg-white/10 mr-2"
//             >
//               <Menu className="h-6 w-6" />
//             </button>
//             <Link
//               to="/dashboard"
//               className="flex items-center gap-2 font-bold text-xl mr-8 px-4 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors duration-200"
//             >
//               <span>
//                 {location.pathname === "/dashboard"
//                   ? "Dashboard"
//                   : location.pathname === "/dashboard/gallery"
//                   ? "Gallery"
//                   : "Dashboard"}
//               </span>
//             </Link>
//             <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">
//               <ScanOutlined className="text-lg" />
//               <span>QR Code</span>
//             </div>
//           </div>

//           {/* Right Side: Notifications and Logout */}
//           <div className="flex items-center space-x-4">
//             <button
//               onClick={() => setIsNotificationOpen(true)}
//               className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
//             >
//               <Bell className="h-6 w-6" />
//               <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
//             </button>
//             <button
//               onClick={handleLogout}
//               className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition-all duration-200"
//             >
//               <LogOut size={18} />
//               <span>Logout</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       <NotificationDrawer
//         open={isNotificationOpen}
//         onClose={() => setIsNotificationOpen(false)}
//       />
//     </nav>
//   );
// }
import { BellIcon, LogOut, Menu, QrCode, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import NotificationDrawer from "../NotificationDrawer";
import { useAuth } from "../../authentication/useAuth";

interface NavbarProps {
  toggleSidebar: () => void;
}
const AdminNavbar = ({ toggleSidebar }: NavbarProps) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { logout } = useAuth();

  const notificationCount = 3;

  // const handleLogout = () => {
  //   console.log("Logging out...");
  // };

  // const handleNotificationClick = () => {
  //   console.log("Opening notifications...");
  //   setIsNotificationOpen(true); // this was missing
  // };

  return (
    <nav>
      {/* backdrop-blur-md border-b border-border/50 */}
      <div className=" bg-white backdrop-blur-md border-b border-border/50 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Title */}
          <Button
            onClick={toggleSidebar}
            className="lg:hidden rounded-md hover:bg-white/10 mr-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex flex-shrink-0">
            <h1 className="text-xl font-bold text-foreground">Your App</h1>
            {/* Search bar or other center content */}
            <div className="flex-1 flex justify-center px-4">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <QrCode className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">QR Scanner</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => setIsNotificationOpen(true)}
            >
              <BellIcon className="h-10 w-10" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            <NotificationDrawer
              open={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User size={24} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
