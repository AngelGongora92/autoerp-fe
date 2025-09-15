import { Badge, Space, Typography, Button } from "antd";
import { 
  MailOutlined, 
  BellFilled, 
  CarOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';



function AppHeader({ collapsed, onToggle }) {
  return (
    <div className="AppHeader">
      <Space align="center">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          className="AppHeader-menu-button"
        />
        <CarOutlined className="AppHeader-logo-icon" />
        <Typography.Title level={4} className="AppHeader-title">
          AutoERP
        </Typography.Title>
      </Space>
      <Space className="AppHeader-right-icons">
        <Badge count={5} dot>
          <MailOutlined />
        </Badge>
        <Badge count={2}>
          <BellFilled />
        </Badge>
      </Space>
    </div>
  );
}

export default AppHeader;