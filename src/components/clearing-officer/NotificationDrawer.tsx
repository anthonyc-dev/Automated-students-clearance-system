import {
  Drawer,
  List,
  Badge,
  Typography,
  Space,
  Button,
  Popconfirm,
} from "antd";
import { BellOutlined, DeleteOutlined, ClearOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { toast } from "sonner";
import { useAuth } from "@/authentication/useAuth";

const { Text } = Typography;

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: {
    toDate: () => Date;
  };
}

const NotificationDrawer = ({ open, onClose }: NotificationDrawerProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Notification[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      // Show all notifications without filtering
      setNotifications(list);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Delete a single notification
  const deleteNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      const notificationRef = doc(db, "notifications", notificationId);
      await deleteDoc(notificationRef);
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    } finally {
      setLoading(false);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      setLoading(true);
      const deletePromises = notifications.map((notification) => {
        const notificationRef = doc(db, "notifications", notification.id);
        return deleteDoc(notificationRef);
      });

      await Promise.all(deletePromises);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Space>
            <BellOutlined />
            <span>Notifications</span>
            <Badge count={unreadCount} />
          </Space>
          {notifications.length > 0 && (
            <Popconfirm
              title="Clear all notifications"
              description="Are you sure you want to delete all notifications?"
              onConfirm={clearAllNotifications}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<ClearOutlined />}
                loading={loading}
                disabled={loading}
              >
                Clear all
              </Button>
            </Popconfirm>
          )}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={350}
    >
      {notifications.length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}
        >
          <BellOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <Text type="secondary">No notifications</Text>
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          loading={loading}
          renderItem={(item: Notification) => (
            <List.Item
              key={item.id}
              actions={[
                <Popconfirm
                  title="Delete notification"
                  description="Are you sure you want to delete this notification?"
                  onConfirm={() => deleteNotification(item.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={loading}
                    disabled={loading}
                    title="Delete"
                  />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text
                      strong={!item.isRead}
                      type={item.isRead ? "secondary" : undefined}
                    >
                      {item.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {item.createdAt?.toDate
                        ? item.createdAt.toDate().toLocaleString()
                        : "Just now"}
                    </Text>
                  </Space>
                }
                description={item.message}
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

export default NotificationDrawer;
