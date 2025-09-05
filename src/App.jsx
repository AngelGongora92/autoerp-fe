import { Space } from 'antd';

import "./App.css";
import AppHeader from './components/app-header/Index.jsx';
import SideMenu from './components/side-menu/Index.jsx';
import PageContent from './components/page-content/Index.jsx';
import AppFooter from './components/app-footer/Index.jsx';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './components/app-routes/Index.jsx';


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