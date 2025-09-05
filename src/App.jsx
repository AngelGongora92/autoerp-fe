import { Space } from 'antd';

import "./App.css";
import AppHeader from './components/app-header';
import SideMenu from './components/side-menu';
import PageContent from './components/page-content';
import AppFooter from './components/app-footer';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './components/app-routes/Index';


function App() {
  return (
  <div className="App">
    <BrowserRouter>
      <AppHeader />
      <Space> 
        <SideMenu />
        <PageContent>
          <AppRoutes />
        </PageContent>
      </Space>
      <AppFooter />
    </BrowserRouter>
  </div>
  );
  
}

export default App;