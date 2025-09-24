import React, { useState, useMemo, useEffect } from 'react';
import { Table, Tag, Spin, Button, Space, Input } from 'antd';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

const columnsConfig = () => [
    { 
        title: 'Folio', 
        dataIndex: 'c_order_id', 
        key: 'c_order_id', 
        align: 'center', 
        sorter: (a, b) => a.c_order_id.localeCompare(b.c_order_id) 
    },
    { 
        title: 'Fecha', 
        dataIndex: 'order_date', 
        key: 'order_date', 
        align: 'center', 
        render: (date) => dayjs(date).format('YYYY-MM-DD'),
        sorter: (a, b) => dayjs(a.order_date).unix() - dayjs(b.order_date).unix()
    },
    { 
        title: 'Cliente ID', 
        dataIndex: 'customer_id', 
        key: 'customer_id', 
        align: 'center' 
    },
    { 
        title: 'Asesor ID', 
        dataIndex: 'advisor_id', 
        key: 'advisor_id', 
        align: 'center' 
    },
    { 
        title: 'Técnico ID', 
        dataIndex: 'mechanic_id', 
        key: 'mechanic_id', 
        align: 'center' 
    },
    { 
        title: 'Estatus Op.', 
        dataIndex: 'op_status_id', 
        key: 'op_status_id', 
        align: 'center',
        render: (status) => status ? <Tag color="processing">{`Estatus ${status}`}</Tag> : <Tag>N/A</Tag>
    },
    { 
        title: 'Acciones', 
        key: 'actions', 
        align: 'center', 
        render: (_, record) => (
            <Space size="middle" wrap>
              <Button type="primary" ghost onClick={() => console.log('Edit order', record.order_id)}>Ver / Editar</Button>
            </Space>
        )
    },
];

function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;
  
  const [searchText, setSearchText] = useState('');
  
  useEffect(() => {
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/orders/`);
            if (!response.ok) {
                throw new Error('No se pudieron cargar las órdenes');
            }
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    fetchOrders();
  }, [apiUrl]);

  const columns = useMemo(() => columnsConfig(), []);

  const filteredOrders = useMemo(() => 
    orders.filter(order =>
      order.c_order_id && order.c_order_id.toLowerCase().includes(searchText.toLowerCase())
  ), [orders, searchText]);

  if (error) return <div>Error al cargar los datos: {error.message}</div>;
  if (loading) return <Spin tip="Cargando órdenes..." size="large" fullscreen />;

  return (
    <div style={{ padding: '10px' }}>
      
      <h2>Órdenes de Servicio</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Input
          placeholder="Buscar por folio..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 240 }}
        />
        <Link to="/new-order">
          <Button type="primary">
            Nueva Orden
          </Button>
        </Link>
      </div>

      <Table 
        size="middle"
        columns={columns}
        dataSource={filteredOrders}
        rowKey="order_id"
        pagination={{ pageSize: 10, position: ['bottomCenter'] }}
      />
    </div>
  );
}

export default OrdersTable;