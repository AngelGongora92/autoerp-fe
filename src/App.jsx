import { Layout } from 'antd';
import { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';

import "./App.css";
import AppHeader from './components/app-header/index.jsx';
import SideMenu from './components/side-menu/index.jsx';
import PageContent from './components/page-content/index.jsx';
import AppFooter from './components/app-footer/index.jsx';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './components/app-routes/index.jsx';

const { Header, Sider, Content, Footer } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [showMenuButtonAnimation, setShowMenuButtonAnimation] = useState(false);

  useEffect(() => {
    // Al cargar, si es móvil, colapsamos el menú y activamos la animación.
    if (isMobile) {
      setCollapsed(true);
      setShowMenuButtonAnimation(true);
      // Desactivamos la clase de animación después de 3 segundos para que no se repita.
      const timer = setTimeout(() => setShowMenuButtonAnimation(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowMenuButtonAnimation(false);
    }
  }, [isMobile]);

  return (
  <div className="App">
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header style={{ padding: 0, height: 'auto', lineHeight: 'normal', background: 'transparent' }}>
          <AppHeader collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} showMenuButtonAnimation={showMenuButtonAnimation} />
        </Header>
        <Layout style={{ flexGrow: 1, flexShrink: 0, display: 'flex', flexDirection: 'row' }}> {/* Este Layout intermedio debe crecer verticalmente */}
          <Sider 
          width={160} 
          theme="light" 
          style={{ background: '#fff' }}
          breakpoint="lg"
          collapsedWidth="0"
          trigger={null}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}>
            {/* Pasa la prop onClose a SideMenu para que pueda controlar la visibilidad */}
            <SideMenu onClose={() => setCollapsed(true)} />
          </Sider>
          <Content style={{ flexGrow: 1, flexShrink: 0, padding: '24px' }}> {/* El Content debe crecer horizontalmente */}
            <PageContent>
              <AppRoutes />
            </PageContent>
          </Content>
        </Layout>
        <Footer style={{ textAlign: 'center', padding: '10px 50px', flexShrink: 0 }}>
          <AppFooter />
        </Footer>
      </Layout>
    </BrowserRouter>
  </div>
  );
  
}

export default App;