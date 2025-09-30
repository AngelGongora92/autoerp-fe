import { Badge, Space, Typography, Button } from "antd";
import classNames from 'classnames';
import { 
  MailOutlined, 
  BellFilled, 
  CarOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';



function AppHeader({ collapsed, onToggle, showMenuButtonAnimation }) {
  const menuButtonClasses = classNames('AppHeader-menu-button', {
    'menu-button-highlight': showMenuButtonAnimation,
  });

  return (
    <div className="AppHeader">
      <Space align="center">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          className={menuButtonClasses}
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