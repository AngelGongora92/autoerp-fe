import React, { useState, useMemo, useEffect } from 'react';
import { Table, Tag, Spin, Button, Space, Input } from 'antd';
import { Link } from 'react-router-dom';
import OrderDrawer from '../order-drawer'; // Importamos el drawer
import dayjs from 'dayjs';

const columnsConfig = (handleViewOrder, customerMap, employeeMap) => [
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
        title: 'Cliente', 
        dataIndex: 'customer_id', 
        key: 'customer_id', 
        align: 'center',
        render: (id) => customerMap.get(id) || `ID: ${id}`
    },
    { 
        title: 'Asesor', 
        dataIndex: 'advisor_id', 
        key: 'advisor_id', 
        align: 'center',
        render: (id) => employeeMap.get(id) || `ID: ${id}`
    },
    { 
        title: 'Técnico', 
        dataIndex: 'mechanic_id', 
        key: 'mechanic_id', 
        align: 'center',
        render: (id) => employeeMap.get(id) || `ID: ${id}`
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
            <Space size="middle">
              <Button type="primary" ghost onClick={() => handleViewOrder(record)}>Ver / Editar</Button>
            </Space>
        )
    },
];

function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const [customers, setCustomers] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  const [searchText, setSearchText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Función para mostrar el drawer con la información de la orden seleccionada
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  // Función para cerrar el drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };
  
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ordersRes, customersRes, advisorsRes, techniciansRes] = await Promise.all([
          fetch(`${apiUrl}/orders/`),
          fetch(`${apiUrl}/customers/`),
          fetch(`${apiUrl}/employees/1`), // Asesores
          fetch(`${apiUrl}/employees/2`), // Técnicos
        ]);

        if (!ordersRes.ok || !customersRes.ok || !advisorsRes.ok || !techniciansRes.ok) {
          throw new Error('No se pudieron cargar todos los datos necesarios');
        }

        const [ordersData, customersData, advisorsData, techniciansData] = await Promise.all([
          ordersRes.json(),
          customersRes.json(),
          advisorsRes.json(),
          techniciansRes.json(),
        ]);

        setOrders(ordersData);
        setCustomers(customersData);
        setAdvisors(advisorsData);
        setTechnicians(techniciansData);

      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [apiUrl]);

  const customerMap = useMemo(() => {
    return new Map(customers.map(c => [
      c.customer_id, 
      c.is_company ? c.cname : `${c.fname || ''} ${c.lname || ''}`.trim()
    ]));
  }, [customers]);

  const employeeMap = useMemo(() => {
    const allEmployees = [...advisors, ...technicians];
    return new Map(allEmployees.map(e => [
      e.employee_id,
      `${e.fname || ''} ${e.lname1 || ''}`.trim()
    ]));
  }, [advisors, technicians]);

  const columns = useMemo(
    () => columnsConfig(handleViewOrder, customerMap, employeeMap), 
    [customerMap, employeeMap]
  );

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

      {/* El drawer se renderiza aquí, pero solo es visible cuando 'open' es true */}
      <OrderDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        order={selectedOrder}
        customerMap={customerMap}
        employeeMap={employeeMap}
      />
    </div>
  );
}

export default OrdersTable;