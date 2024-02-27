import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect } from 'react';
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Badge,
} from '@nextui-org/react';

async function getNotifications(userRole) {
  const url =
    userRole == 'admin'
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/notifications/list`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/list`;
  const res = await fetch(url);
  return await res.json();
}

export default function TopBarNotifications(props) {
  const { user } = props;
  const [isBadgeVisible, setIsBadgeVisible] = React.useState(false);
  const [defaultMessage, setDefaultMessage] = React.useState(
    'No tienes notificaciones nuevas'
  );
  const [refreshNotifications, setRefreshNotifications] = React.useState(0);
  const [numberNotifications, setNumberNotifications] = React.useState(0);

  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     const fetchRecords = async () => {
  //       const recordsBD = await getNotifications(user.role);

  //       if (!recordsBD.data || !recordsBD.data.total) return;

  //       const { total } = recordsBD.data;

  //       if (total > 0) {
  //         setNumberNotifications(total);
  //         setIsBadgeVisible(true);
  //         if (total > 1)
  //           setDefaultMessage(`Tienes ${total} notificaciones nuevas`);
  //         if (total == 1) setDefaultMessage(`Tienes una nueva notificación`);
  //       }
  //     };
  //     fetchRecords();
  //   }
  // }, [refreshNotifications]);

  //REFRESH NOTIFICATIONS EVERY 60 SECONDS
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setRefreshNotifications((counter) => counter + 1);
  //   }, 60000);
  //   return () => clearInterval(interval);
  // }, []);
  return (
    <>
      <Dropdown placement="bottom-end">
        <Badge
          color="danger"
          content={numberNotifications}
          isInvisible={!isBadgeVisible}
          shape="circle"
        >
          <DropdownTrigger>
            <Image
              src={`/assets/images/theme-light/icon-notification.svg`}
              width={24}
              height={24}
              alt="Notification"
              style={{ cursor: 'pointer' }}
              aria-label={defaultMessage}
            />
          </DropdownTrigger>
        </Badge>
        <DropdownMenu aria-label="Notifications" variant="flat">
          <DropdownItem key="notification">
            <Link href="/dashboard/notifications">{defaultMessage}</Link>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </>
  );
}
