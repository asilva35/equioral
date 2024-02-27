import React from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  NavbarMenuToggle,
  NavbarMenu,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from '@nextui-org/react';
import Image from 'next/image';
import MainNavigation from '@/components/MainNavigation';
import styles from '@/styles/TopBar.module.css';
import TopBarNotifications from '@/components/TopBarNotifications';

export default function ToBar(props) {
  const { user } = props;
  const getUserName = () => {
    if (!user) return 'Invitado';
    let name = user.name || user.username;
    if (name.indexOf(' ') > -1) {
      name = name.split(' ');
      name = name[0];
    }
    return name;
  };
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  return (
    <Navbar isBordered maxWidth="full" onMenuOpenChange={setIsMenuOpen}>
      <NavbarMenuToggle
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        className="hide-md hide-lg hide-xl"
      />
      <NavbarBrand>
        <Link href="/">
          <Image
            src={`/assets/images/theme-light/logo.png`}
            width={176}
            height={89}
            alt="Logo"
            className={`${styles.Logo}`}
          />
        </Link>
      </NavbarBrand>
      <NavbarContent as="div" justify="end" className="hide-xss">
        <NavbarItem className="flex justify-center items-center">
          <TopBarNotifications user={user} />
        </NavbarItem>
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="w-6 h-6 text-tiny avatar-topnav"
              name={getUserName()}
              size="sm"
              src="/assets/images/user-icon-w.svg"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="welcome" className="h-14 gap-2">
              <p className="font-semibold">Bienvenido</p>
              <p className="font-semibold">{getUserName()}</p>
            </DropdownItem>
            <DropdownItem key="profile">
              <Link href="/dashboard/profile">Perfil</Link>
            </DropdownItem>
            {user && user?.role === 'admin' && (
              <DropdownItem key="patients">
                <Link href="/dashboard/patients">Mis Pacientes</Link>
              </DropdownItem>
            )}
            <DropdownItem key="logout" color="danger">
              <Link href="/close-session">Cerrar Sesión</Link>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
      <NavbarMenu>
        <div className={`${styles.MainNavigationCNT}`}>
          <MainNavigation />
        </div>
      </NavbarMenu>
    </Navbar>
  );
}
