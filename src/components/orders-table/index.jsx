import React, { useState, useMemo, useEffect } from 'react';
import { Table, Tag, Spin, Button, Space, Input } from 'antd';
import { Link } from 'react-router-dom';
import OrderDrawer from '../order-drawer'; // Importamos el drawer
import { useMediaQuery } from 'react-responsive';
import dayjs from 'dayjs';
import './index.css';

const columnsConfig = (customerMap, employeeMap) => [
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
        render: (statusId) => {
            if (statusId === 1) {
                return <Tag color="orange">Incompleto</Tag>;
            } else if (statusId === 2) {
                return <Tag color="blue">Abierto</Tag>;
            }
            return statusId ? <Tag color="default">{`Estatus ${statusId}`}</Tag> : <Tag>N/A</Tag>;
        }
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

  // Hook para detectar si estamos en un dispositivo móvil
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // Función para mostrar el drawer con la información de la orden seleccionada
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  // Función para cerrar el drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedOrder(null); // Limpiamos la orden seleccionada para quitar el resaltado
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

        // Ordenamos las órdenes de la más reciente a la más antigua por order_id
        const sortedOrders = ordersData.sort((a, b) => b.order_id - a.order_id);

        setOrders(sortedOrders);
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
    () => columnsConfig(customerMap, employeeMap),
    [customerMap, employeeMap] // handleViewOrder ya no es necesario aquí
  );

  const filteredOrders = useMemo(() => 
    orders.filter(order =>
      (order.c_order_id && order.c_order_id.toLowerCase().includes(searchText.toLowerCase())) ||
      (customerMap.get(order.customer_id) && customerMap.get(order.customer_id).toLowerCase().includes(searchText.toLowerCase()))
  ), [orders, searchText]);

  if (error) return <div>Error al cargar los datos: {error.message}</div>;
  if (loading) return <Spin tip="Cargando órdenes..." size="large" fullscreen />;

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Input
          placeholder="Buscar por folio o cliente..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 240 }}
          allowClear
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
        // Hacemos que la tabla sea desplazable horizontalmente solo en móvil
        scroll={isMobile ? { x: 'max-content' } : undefined}
        rowClassName={(record) => 
          record.order_id === selectedOrder?.order_id ? 'selected-row' : ''
        }
        onRow={(record) => {
          return {
            onClick: () => handleViewOrder(record), // Llama a la función al hacer clic
            style: { cursor: 'pointer' } // Cambia el cursor para indicar que la fila es clickeable
          };
        }}
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