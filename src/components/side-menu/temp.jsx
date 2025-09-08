import { Menu } from "antd";
import { LoadingOutlined, SwapRightOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";

function SideMenu() {
  const navigate = useNavigate();

  return (
    <div className="SideMenu">
      <Menu
        className="custom-sidemenu" 
        mode="inline"
        onClick={(item) => {
          navigate(`/${item.key}`);
        }}
        items={[
        { label: 'Auth', icon: <UserOutlined />, key: 'auth',
          children: [
            { label: 'Usuarios', icon: <SwapRightOutlined />, key: 'users' },
            
          ]
         },
        { label: 'Servicio', icon: <ToolOutlined />, key: 'service', 
          children: [
            { label: 'Citas', icon: <SwapRightOutlined />, key: 'appointments' },
            { label: 'Ordenes', icon: <SwapRightOutlined />, key: 'orders' },
            
          ]
         },
        { label: 'Page2', icon: <LoadingOutlined />, key: 'page2' },
        { label: 'Page3', icon: <LoadingOutlined />, key: 'page3' },
        { label: 'Page4', icon: <LoadingOutlined />, key: 'page4' },
        { label: 'Page5', icon: <LoadingOutlined />, key: 'page5' },
      ]}/>
    </div>
  );
}

export default SideMenu;
