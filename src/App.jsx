import { Layout } from 'antd';

import "./App.css";
import AppHeader from './components/app-header/Index.jsx';
import SideMenu from './components/side-menu/Index.jsx';
import PageContent from './components/page-content/Index.jsx';
import AppFooter from './components/app-footer/Index.jsx';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './components/app-routes/Index.jsx';

const { Sider, Content } = Layout;

function App() {
  return (
  <div className="App">
    <BrowserRouter>
      <AppHeader />
      <Layout>
        <Sider>
          <SideMenu />
        </Sider>
        <Content>
          <PageContent>
            <AppRoutes />
          </PageContent>
        </Content>
      </Layout>
      <AppFooter />
    </BrowserRouter>
  </div>
  );
  
}

export default App;