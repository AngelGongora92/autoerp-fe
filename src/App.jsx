import { Space } from 'antd';
import "./App.css";
import AppHeader from './components/app-header';
import SideMenu from './components/side-menu';
import PageContent from './components/page-content';
import AppFooter from './components/app-footer';




function App() {
  return (
  <div className="App">
  <AppHeader />
  <Space> 
    <SideMenu> </SideMenu>
    <PageContent> </PageContent>
  </Space>
  <AppFooter />
  </div>
  );
  
}

export default App;