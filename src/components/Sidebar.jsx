import React from 'react';
import { Layout } from 'antd'; // 1
import 'antd/dist/reset.css'; // 2

const { Sider } = Layout; // 3

const Sidebar = () => { // 4
  return (
    <Sider style={{ background: '#303030' }}> {/* 5 */}
      {/* 6 */}
      <div style={{ height: '32px', margin: '16px' }}></div>
      {/* 7 */}
    </Sider>
  );
};

export default Sidebar; // 8

