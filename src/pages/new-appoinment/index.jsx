import React, { useState, useRef } from 'react';
import { Button, message, Steps, Card } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import StepOne from './step-one';
import StepTwo from './step-two';
import StepThree from './step-three';

const steps = [
  { title: 'Información del Cliente' },
  { title: 'Motivo y detalles' },
  { title: 'Fecha y confirmación' },
];

function NewAppointmentPage(){
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(false);
    const [appointmentData, setAppointmentData] = useState({});

    const stepOneRef = useRef(null);
    const stepTwoRef = useRef(null);
    const stepThreeRef = useRef(null);

    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;


    const next = async () => {
        setLoading(true);
        try {
            let stepData;
            if (current === 0) {
                stepData = await stepOneRef.current.submitStep();
            } else if (current === 1) {
                stepData = await stepTwoRef.current.submitStep();
            }

            // Unimos los datos del paso actual con los que ya teníamos
            const updatedData = { ...appointmentData, ...stepData };
            setAppointmentData(updatedData);

            console.log('Datos de la cita actualizados:', updatedData); // Log para depurar

            setCurrent(current + 1);
        } catch (error) {
            // El error de validación ya se muestra en el componente hijo (con message.error)
            // No es necesario hacer nada más aquí, solo evitar que avance.
            console.error('Validación fallida, no se puede avanzar.', error);
        } finally {
            setLoading(false);
        }
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            // 1. Obtener los datos del último paso (fecha y hora)
            const stepThreeData = await stepThreeRef.current.submitStep();

            // 2. Combinar todos los datos recolectados
            const finalData = { ...appointmentData, ...stepThreeData };
            console.log('Datos finales para crear la cita:', finalData);

            // 3. Construir el payload según la estructura de la API
            const payload = {
                customer_id: finalData.customer_id,
                contact_id: finalData.contact_id,
                vehicle_id: finalData.vehicle_id,
                reason_id: finalData.reason_id,
                appointment_date: finalData.appointment_date,
                advisor_id: finalData.advisor_id,      // Asesor
                mechanic_id: finalData.mechanic_id,    // Técnico
                scheduled_by: 1, // Placeholder para el usuario logueado
                status_id: 1,    // Placeholder para estado "Programada"
                notes: "",       // No hay campo de notas aún
            };

            // 4. Enviar la petición POST a la API
            const response = await fetch(`${apiUrl}/appointments/new-appointment/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'No se pudo crear la cita.');
            }

            message.success('Cita creada con éxito!');
            navigate('/appointments');
        } catch (error) {
            message.error(error.message || 'Ocurrió un error al finalizar la cita.');
        } finally {
            setLoading(false);
        }
    };

    const items = steps.map((item) => ({
        key: item.title,
        title: item.title,
    }));

    const contentStyle = {
        color: '#333',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px dashed #d9d9d9',
        marginTop: '16px',
        padding: '20px'
    };

    return (
        <Card
            title="Crear Nueva Cita"
            extra={
                <Link to="/appointments">
                    <Button icon={<ArrowLeftOutlined />}>
                        Volver a Citas
                    </Button>
                </Link>
            }
        >
            <Steps current={current} items={items} />
            <div style={contentStyle}>
                <div style={{ display: current === 0 ? 'block' : 'none' }}><StepOne ref={stepOneRef} /></div>
                <div style={{ display: current === 1 ? 'block' : 'none' }}><StepTwo ref={stepTwoRef} appointmentData={appointmentData} /></div>
                <div style={{ display: current === 2 ? 'block' : 'none' }}><StepThree ref={stepThreeRef} appointmentData={appointmentData} /></div>
            </div>
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
                {current > 0 && (
                    <Button style={{ margin: '0 8px' }} onClick={prev} loading={loading}>Anterior</Button>
                )}
                {current < steps.length - 1 && (
                    <Button type="primary" onClick={next} loading={loading}>Siguiente</Button>
                )}
                {current === steps.length - 1 && (
                    <Button type="primary" onClick={handleFinish} loading={loading}>Finalizar</Button>
                )}
            </div>
        </Card>
    );
}

export default NewAppointmentPage;