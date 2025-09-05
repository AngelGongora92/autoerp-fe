import { Badge, Space, Typography } from "antd";
import { MailOutlined, BellFilled, CarOutlined } from '@ant-design/icons';



function AppHeader() {
  return (
    <div className="AppHeader">
      <CarOutlined style={{ fontSize: 24, color: 'black' }}/>
      <Typography.Title>
        AutoERP
      </Typography.Title>
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