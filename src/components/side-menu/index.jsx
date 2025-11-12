import { useEffect, useRef, useState } from "react";
import { Menu } from "antd";
// Asegúrate de que 'react-responsive' esté instalado: npm install react-responsive
import { useMediaQuery } from 'react-responsive';
import { LoadingOutlined, SwapRightOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";

function SideMenu({ onClose = () => {} }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const isMobile = useMediaQuery({ maxWidth: 767 }); // Define el breakpoint para móvil

  // Hook para detectar clics fuera del menú
  useEffect(() => {
    const handleClickOutside = (event) => {
      // --- DEBUGGING INICIO ---
      // console.log('Click detectado. isMobile:', isMobile);
      // console.log('menuRef.current:', menuRef.current);
      // console.log('event.target:', event.target);
      // console.log('menuRef.current.contains(event.target):', menuRef.current?.contains(event.target));
      // --- DEBUGGING FIN ---

      // Si el menú existe y el clic fue fuera de él, llama a onClose
      if (isMobile) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          // console.log('Cerrando menú por clic fuera (móvil).'); // DEBUG
          onClose();
        }
      }
    };

    // Agrega el listener cuando el componente se monta
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Limpia el listener cuando el componente se desmonta
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, isMobile, menuRef]); // Agregamos menuRef a las dependencias por buena práctica

  return (
    <div className="SideMenu" ref={menuRef}>
      <Menu
        className="custom-sidemenu" 
        mode="inline"
        // Si el menú está en modo "inline" y no es un "Drawer" o "Modal",
        // es posible que no necesite cerrarse automáticamente al hacer clic en un enlace,
        // ya que no "cubre" el contenido. Pero si es un overlay, esta lógica es correcta.
        onClick={(item) => {
          navigate(`/${item.key}`);
          // Llama a onClose después de navegar para cerrar el menú solo en móvil
          if (isMobile) {
            onClose();
          }
        }}
        items={[
        { label: 'Admin', icon: <UserOutlined />, key: 'auth',
          children: [
            { label: 'Usuarios', icon: <SwapRightOutlined />, key: 'users' },
            { label: 'Inventarios', icon: <SwapRightOutlined />, key: 'orders-inventories' }, // This is already correct
            
          ]
         },
        { label: 'Servicio', icon: <ToolOutlined />, key: 'service', 
          children: [
            { label: 'Citas', icon: <SwapRightOutlined />, key: 'appointments' },
            { label: 'Ordenes', icon: <SwapRightOutlined />, key: 'orders' },
            
          ]
         },
        { label: 'Page2', icon: <LoadingOutlined />, key: 'page2' },
        { label: 'Page3', icon: <LoadingOutlined />, key: 'page3' },
        { label: 'Page4', icon: <LoadingOutlined />, key: 'page4' },
        { label: 'Page5', icon: <LoadingOutlined />, key: 'page5' },
      ]}/>
    </div>
  );
}

export default SideMenu;
