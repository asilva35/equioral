import Layout from '@/components/Layout';
import Metaheader from '@/components/Metaheader';
import NewPatientBanner from '@/components/dashboard/NewPatientBanner';
import { ThemeContext } from '@/contexts/ThemeContext';
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

function DashBoardScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user && session?.user?.role === 'admin')
      router.push('/dashboard/patients');
  }, [router, session]);

  return (
    <>
      <Metaheader />
      <Layout theme={theme} toogleTheme={toggleTheme}>
        {/* <NewPatientBanner /> */}
      </Layout>
    </>
  );
}

DashBoardScreen.auth = true;
export default DashBoardScreen;
