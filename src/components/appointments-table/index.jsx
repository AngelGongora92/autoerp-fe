import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

const columns = [
  {
    title: 'ID Cita',
    dataIndex: 'appointment_id',
    key: 'appointment_id',
    sorter: (a, b) => a.appointment_id - b.appointment_id,
  },
  {
    title: 'Fecha',
    dataIndex: 'appointment_date',
    key: 'appointment_date',
    render: (date) => dayjs(date).format('DD/MM/YYYY'),
    sorter: (a, b) => dayjs(a.appointment_date).unix() - dayjs(b.appointment_date).unix(),
  },
  {
    title: 'Hora',
    dataIndex: 'appointment_date',
    key: 'time',
    render: (date) => dayjs(date).format('hh:mm A'),
  },
  {
    title: 'Cliente',
    dataIndex: ['customer', 'label'], // Asumiendo que la API devuelve un objeto customer anidado
    key: 'customer',
  },
  {
    title: 'Vehículo',
    dataIndex: ['vehicle', 'label'], // Asumiendo que la API devuelve un objeto vehicle anidado
    key: 'vehicle',
  },
  {
    title: 'Servicio Solicitado',
    dataIndex: ['reason', 'reason'], // Asumiendo que la API devuelve un objeto reason anidado
    key: 'reason',
  },
  {
    title: 'Estatus',
    dataIndex: ['status', 'status'], // Asumiendo que la API devuelve un objeto status anidado
    key: 'status',
    render: (status) => (
      <Tag color={status === 'Programada' ? 'blue' : 'green'} key={status}>
        {status?.toUpperCase() || 'N/A'}
      </Tag>
    ),
  },
];

function AppointmentsTable() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(`${apiUrl}/appointments/`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar las citas.');
        }
        const data = await response.json();
        // Usamos 'appointment_id' como 'key' para la tabla
        const processedData = data.map(item => ({ ...item, key: item.appointment_id }));
        setAppointments(processedData);
      } catch (error) {
        message.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [apiUrl]);

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Link to="/new-appointment">
          <Button type="primary" icon={<PlusOutlined />}>
            Nueva Cita
          </Button>
        </Link>
      </div>
      <Table columns={columns} dataSource={appointments} loading={loading} />
    </div>
  );
}

export default AppointmentsTable;