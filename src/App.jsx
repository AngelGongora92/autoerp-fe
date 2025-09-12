import { Layout } from 'antd';

import "./App.css";
import AppHeader from './components/app-header/index.jsx';
import SideMenu from './components/side-menu/index.jsx';
import PageContent from './components/page-content/index.jsx';
import AppFooter from './components/app-footer/index.jsx';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './components/app-routes/index.jsx';

const { Header, Sider, Content, Footer } = Layout;

function App() {
  return (
  <div className="App">
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ padding: 0, height: 'auto', lineHeight: 'normal', background: 'transparent' }}>
          <AppHeader />
        </Header>
        <Layout>
          <Sider width={250} theme="light" style={{ background: '#fff' }}>
            <SideMenu />
          </Sider>
          <Content style={{ margin: 'auto' }}>
            <PageContent>
              <AppRoutes />
            </PageContent>
          </Content>
        </Layout>
        <Footer style={{ textAlign: 'center', padding: '10px 50px' }}>
          <AppFooter />
        </Footer>
      </Layout>
    </BrowserRouter>
  </div>
  );
  
}

export default App;