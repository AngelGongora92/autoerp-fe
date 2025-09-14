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
          style={{ fontSize: '16px' }}
        />
        <CarOutlined style={{ fontSize: 24, color: 'black' }}/>
        <Typography.Title level={4} style={{ margin: 0 }}>
          AutoERP
        </Typography.Title>
      </Space>
      <Space>
        <Badge count={5} dot>
          <MailOutlined style={{ fontSize: 24 }} />
        </Badge>
        <Badge count={2}>
          <BellFilled style={{ fontSize: 24 }}/>
        </Badge>
      </Space>
    </div>
  );
}

export default AppHeader;