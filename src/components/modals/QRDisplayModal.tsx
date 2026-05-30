import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export function QRDisplayModal() {
  const { openModal, hideModal, qrDisplayProduct } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const open = openModal === 'qr-display';

  useEffect(() => {
    if (!open || !qrDisplayProduct || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 300;
    canvas.height = 300;

    QRCode.toCanvas(canvas, qrDisplayProduct.productCode, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then(() => {
        api.saveQrCode(qrDisplayProduct.productCode, canvas.toDataURL('image/png')).catch(console.error);
      })
      .catch((err) => {
        console.error('QR Code generation error:', err);
        alert('Error generating QR code: ' + err.message);
        hideModal();
      });
  }, [open, qrDisplayProduct, hideModal]);

  const handlePrint = () => {
    if (!qrDisplayProduct || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Print QR Code</title></head>
      <body style="text-align:center;font-family:sans-serif;">
        <h2>${qrDisplayProduct.name}</h2>
        <p>Product ID: ${qrDisplayProduct.productCode}</p>
        <img src="${dataUrl}" style="max-width:300px;" />
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleDownload = () => {
    if (!qrDisplayProduct || !canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QR_${qrDisplayProduct.productCode}_${qrDisplayProduct.name.replace(/\s+/g, '_')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  if (!qrDisplayProduct) return null;

  return (
    <Modal
      open={open}
      onClose={hideModal}
      title="Product QR Code"
      footer={
        <>
          <button type="button" className="btn-print" onClick={handlePrint}>Print QR Code</button>
          <button type="button" className="btn-save" onClick={handleDownload}>Download QR Code</button>
          <button type="button" className="btn-close" onClick={hideModal}>Close</button>
        </>
      }
    >
      <div className="qr-content">
        <h3>{qrDisplayProduct.name}</h3>
        <p>Product ID: {qrDisplayProduct.productCode}</p>
        <canvas ref={canvasRef} className="qr-canvas" />
      </div>
    </Modal>
  );
}
