import React, { useState, useRef, useEffect } from 'react';
import { Select, Input, Button, Row, Col, Card, Space, Modal, Upload, message, Image, Typography, Form } from 'antd';
import { CameraOutlined, CloseOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase'; // Importamos el cliente de Supabase

const { Option } = Select;

// Este es el componente para el checklist visual de selección libre
const FreeSelectionBodywork = ({ imageSrc, points, setPoints, damageTypes, orderId, viewKey, onRemovePoint }) => {
  const svgRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [currentPointIndexForUpload, setCurrentPointIndexForUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Creamos un mapa de refs para poder hacer scroll a cada tarjeta individualmente
  const itemRefs = useRef(new Map());

  const BUCKET_NAME = 'AutoERP-Storage'; // El nombre de tu bucket en Supabase

  // Función para limpiar el punto previamente seleccionado si está vacío
  const cleanupPreviousPoint = (currentSelectedIndex) => {
    if (currentSelectedIndex === null) return { wasCleaned: false };
    
    const pointToTest = points[currentSelectedIndex];
    if (pointToTest && pointToTest.type === null && pointToTest.notes === '') {
      setPoints(currentPoints => currentPoints.filter((_, i) => i !== currentSelectedIndex));
      return { wasCleaned: true };
    }
    return { wasCleaned: false };
  };

  const handleOpenUploadModal = (index) => {
    setCurrentPointIndexForUpload(index);
    setIsUploadModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsUploadModalVisible(false);
    setCurrentPointIndexForUpload(null);
  };

  const handleImageUpload = async (options) => {
    const { file } = options;
    if (currentPointIndexForUpload === null || !orderId) {
      message.error("No se puede subir la imagen: falta el ID de la orden.");
      return;
    }

    setUploading(true);
    try {
      // 1. Determinar la carpeta del entorno
      const envFolder = import.meta.env.MODE === 'development' ? 'dev' : 'prod';

      // 2. Construir el nombre del archivo y la ruta completa
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
      const filePath = `${envFolder}/bodywork_checklist/${orderId}/${viewKey}/${fileName}`;

      console.log(`Subiendo imagen a Supabase en la ruta: ${filePath}`);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!data || !data.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen.');
      }

      // Actualizamos el punto con la URL de la imagen
      handleUpdatePoint(currentPointIndexForUpload, { picture_path: data.publicUrl });
      
      message.success(`${file.name} subido correctamente.`);

    } catch (error) {
      message.error(`Error al subir la imagen: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Cuando la imagen cambia (cambio de vista), reseteamos la selección.
  useEffect(() => {
    setSelectedIndex(null);
    // También podríamos limpiar puntos vacíos aquí si fuera necesario.
  }, [imageSrc]);


  const handleSvgClick = (event) => {
    if (!svgRef.current) return;

    // Evita añadir un punto si se está interactuando con un elemento existente (punto o texto)
    if (['circle', 'text', 'g'].includes(event.target.tagName)) {
      return;
    }

    // Limpia el punto anterior si estaba vacío
    cleanupPreviousPoint(selectedIndex);

    const svgRect = svgRef.current.getBoundingClientRect();
    const viewBox = svgRef.current.viewBox.baseVal;

    const ratioX = viewBox.width / svgRect.width;
    const ratioY = viewBox.height / svgRect.height;

    const clickXInPixels = event.clientX - svgRect.left;
    const clickYInPixels = event.clientY - svgRect.top;

    const x = clickXInPixels * ratioX;
    const y = clickYInPixels * ratioY;
    
    const newPoint = {
      x,
      y,
      type: null, // Valor por defecto es null para que aparezca el placeholder
      notes: '',
    };

    // Añade el nuevo punto y lo selecciona para edición
    setPoints(currentPoints => {
      const newPoints = [...currentPoints, newPoint];
      setSelectedIndex(newPoints.length - 1);
      return newPoints;
    });
  };

  const handlePointClick = (e, index) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (selectedIndex !== index) {
      const { wasCleaned } = cleanupPreviousPoint(selectedIndex);
      // Si se limpió un punto anterior que estaba antes en el array, el índice del nuevo punto seleccionado se reduce en 1.
      const newIndex = wasCleaned && index > selectedIndex ? index - 1 : index;
      setSelectedIndex(newIndex);
    } else {
      setSelectedIndex(index);
    }
  };

  const handleUpdatePoint = (index, newValues) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], ...newValues };
    setPoints(newPoints);
  };

  const handleRemovePoint = (indexToRemove) => {
    onRemovePoint(indexToRemove);
  };

  const getPointColor = (type) => {
    const damageType = damageTypes.find(dt => dt.detail_type_id === type);
    if (!damageType || !damageType.color) {
      return '#8c8c8c'; // Gris para puntos sin tipo o sin color definido
    }

    // Mapeamos los nombres de colores de la API a valores CSS válidos.
    // Puedes extender este mapa si tu API devuelve más colores.
    const colorMap = {
      rojo: '#ff4d4f',
      azul: '#1677ff',
      naranja: '#faad14',
      verde: '#52c41a',
      amarillo: '#fadb14',
    };
    return colorMap[damageType.color.toLowerCase()] || damageType.color;
  };

  // Efecto para hacer scroll hacia la tarjeta de edición cuando se selecciona un punto
  useEffect(() => {
    if (selectedIndex !== null) {
      const ref = itemRefs.current.get(selectedIndex);
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <>
      <div style={{ width: '100%', maxWidth: '600px', margin: 'auto' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 800 350"
        onClick={handleSvgClick}
        style={{ cursor: 'crosshair', width: '100%', height: 'auto', border: '1px solid #d9d9d9', borderRadius: '8px' }}
      >
        <image href={imageSrc} width="100%" height="100%" />
        {points.map((point, index) => (
          <g
            key={index}
            onClick={(e) => handlePointClick(e, index)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r={index === selectedIndex ? 20 : 15}
              stroke={index === selectedIndex ? '#1677ff' : 'white'}
              strokeWidth="2"
              fill={getPointColor(point.type)}
              style={{ transition: 'all 0.2s ease-in-out' }}
            />
            <text
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dy=".3em"
              fill="white"
              fontSize="20"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>

      <div style={{ marginTop: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {points.map((point, index) => (
            <Card
              key={index}
              ref={(el) => itemRefs.current.set(index, el)}
              title={`Punto #${index + 1}`}
              extra={
                <Button
                  type="text"
                  shape="circle"
                  icon={<CloseOutlined />}
                  onClick={(e) => { e.stopPropagation(); handleRemovePoint(index); }}
                />
              }
              size="small"
              style={{ 
                border: index === selectedIndex ? '1px solid #1677ff' : '1px solid #d9d9d9',
                cursor: 'pointer'
              }}
              onClick={() => handlePointClick(null, index)}
            >
              <Row gutter={[8, 8]} align="middle">
                <Col flex="150px">
                  <Select
                    placeholder={"Seleccionar"}
                    value={point.type}
                    style={{ width: '100%' }}
                    onChange={(value) => handleUpdatePoint(index, { type: value })}
                    onClick={(e) => e.stopPropagation()}
                    allowClear
                  >
                    {damageTypes.map(dt => (
                      <Option key={dt.detail_type_id} value={dt.detail_type_id}>{dt.type}</Option>
                    ))}
                  </Select>
                </Col>
                <Col flex="auto">
                  <Input
                    placeholder="Notas adicionales..."
                    value={point.notes}
                    onChange={(e) => handleUpdatePoint(index, { notes: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Col>
                <Col xs={24} sm={24} md="110px">
                  {point.picture_path ? (
                     <Button 
                        icon={<EyeOutlined />} 
                        style={{ width: '100%' }} 
                        onClick={(e) => { e.stopPropagation(); handleOpenUploadModal(index); }}
                      >
                        Ver/Cambiar
                      </Button>
                  ) : (
                    <Button 
                      icon={<CameraOutlined />} 
                      style={{ width: '100%' }} 
                      onClick={(e) => { e.stopPropagation(); handleOpenUploadModal(index); }}>
                      Añadir Foto
                    </Button>
                  )}
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
      </div>

      {/* Modal para subir la imagen */}
      <Modal
        title={`Foto para el Punto #${currentPointIndexForUpload !== null ? currentPointIndexForUpload + 1 : ''}`}
        open={isUploadModalVisible}
        onCancel={handleModalCancel}
        footer={
          <Space>
            {points[currentPointIndexForUpload]?.picture_path && (
              <Upload customRequest={handleImageUpload} showUploadList={false}>
                <Button loading={uploading}>
                  {uploading ? 'Subiendo...' : 'Cambiar Imagen'}
                </Button>
              </Upload>
            )}
            <Button key="done" type="primary" onClick={handleModalCancel}>
              Listo
            </Button>
          </Space>
        }
        destroyOnClose
      >
        {points[currentPointIndexForUpload]?.picture_path && (
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Typography.Title level={5}>Imagen Actual</Typography.Title>
            <Image
              width={200}
              src={points[currentPointIndexForUpload].picture_path}
            />
          </div>
        )}
        {!points[currentPointIndexForUpload]?.picture_path && (
          <Upload.Dragger 
            customRequest={handleImageUpload} 
            showUploadList={false}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Haz clic o arrastra una imagen a esta área para subirla</p>
          </Upload.Dragger>
        )}
      </Modal>
    </>
  );
};

export default FreeSelectionBodywork;